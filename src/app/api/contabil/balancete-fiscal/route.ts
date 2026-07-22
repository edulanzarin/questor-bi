import { pool } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import { balanceteFiscal, CONTA_CONTRAPARTIDA } from "@/lib/balancete-fiscal";
import type { BalanceteFiscalResp, BalanceteLinha } from "@/lib/types";

/**
 * Balancete FISCAL: a movimentação de débito/crédito que as notas DEVERIAM
 * gerar pelas regras (motor), lado a lado com a movimentação REAL de origem
 * fiscal (o que o Questor de fato lançou), na árvore do plano de contas. A
 * diferença por conta aponta valor que foi parar na conta errada.
 *
 * Escopo (opção 2): movimento nota a nota (ME/MS). O motor só lança nas contas
 * que de fato aparecem no ME real (as de apuração mensal ficam de fora); os
 * componentes que não dá pra avaliar contam na cobertura. A contrapartida
 * variável (fornecedor/cliente) fica fora da árvore comparativa por ora.
 */
export const GET = apiRoute(async (req) => {
  const f = parseFilters(req.nextUrl.searchParams);
  if (f.empresas.length !== 1) throw new FilterError("Selecione uma empresa para o balancete");
  const empresa = f.empresas[0];

  const client = await pool.connect();
  try {
    const p = [empresa, f.inicio, f.fim] as const;

    // Movimento REAL de TODA origem fiscal por conta (notas ME/MS + consolidações
    // MOV + apuração IM + retenção RE) — pra o Contábil ficar completo: varejo
    // vende muito por cupom consolidado (origem MOV), que não é nota individual.
    const real = await client.query<{ conta: number; natureza: number; origem: string; valor: number }>(
      `select contactbdeb conta, 1 natureza, substring(chaveorigem for 2) origem, sum(valorlctoctb)::float valor
         from lctoctb where codigoempresa=$1 and codigooriglctoctb='FI'
           and datalctoctb between $2 and $3 and contactbdeb is not null
        group by contactbdeb, substring(chaveorigem for 2)
       union all
       select contactbcred, -1, substring(chaveorigem for 2), sum(valorlctoctb)::float
         from lctoctb where codigoempresa=$1 and codigooriglctoctb='FI'
           and datalctoctb between $2 and $3 and contactbcred is not null
        group by contactbcred, substring(chaveorigem for 2)`,
      [...p]
    );
    const ehNota = (o: string) => o === "ME" || o === "MS";
    const realPorConta = new Map<number, { deb: number; cred: number }>();
    const observadas = new Set<string>();
    for (const r of real.rows) {
      const a = realPorConta.get(r.conta) ?? { deb: 0, cred: 0 };
      if (r.natureza === 1) a.deb += r.valor;
      else a.cred += r.valor;
      realPorConta.set(r.conta, a);
      // Só as NOTAS calibram o motor. Apuração/consolidação ficam fora, senão o
      // motor geraria imposto que na verdade é da apuração mensal.
      if (ehNota(r.origem)) observadas.add(`${r.natureza}:${r.conta}`);
    }

    // Movimento FISCAL (hipotético) — entradas + saídas.
    const [ent, sai] = await Promise.all([
      balanceteFiscal(client, empresa, f.inicio, f.fim, "ent", undefined, observadas),
      balanceteFiscal(client, empresa, f.inicio, f.fim, "sai", undefined, observadas),
    ]);
    const fiscalPorConta = new Map<number, { deb: number; cred: number }>();
    for (const mov of [ent, sai]) {
      for (const [conta, m] of mov.porConta) {
        if (conta === CONTA_CONTRAPARTIDA) continue; // fora da árvore por ora
        const a = fiscalPorConta.get(conta) ?? { deb: 0, cred: 0 };
        a.deb += m.debito;
        a.cred += m.credito;
        fiscalPorConta.set(conta, a);
      }
    }
    // Espelho por ORIGEM do movimento (não por conta): movimento de NOTA numa
    // conta que o motor gera é a comparação (não espelha — pode ter erro de
    // conta). Todo o resto entra no fiscal com o próprio real: consolidação
    // (MOV), apuração (IM), retenção (RE), e o movimento de nota em conta sem
    // regra (contrapartida fornecedor/cliente, NFSE). Assim uma receita que tem
    // nota + cupom consolidado bate (nota pelo motor, cupom espelhado).
    const regrada = new Set<string>();
    for (const [conta, m] of fiscalPorConta) {
      if (m.deb > 0.005) regrada.add(`1:${conta}`);
      if (m.cred > 0.005) regrada.add(`-1:${conta}`);
    }
    for (const r of real.rows) {
      if (ehNota(r.origem) && regrada.has(`${r.natureza}:${r.conta}`)) continue;
      const a = fiscalPorConta.get(r.conta) ?? { deb: 0, cred: 0 };
      if (r.natureza === 1) a.deb += r.valor;
      else a.cred += r.valor;
      fiscalPorConta.set(r.conta, a);
    }

    // Plano de contas (para nome, classificação e sintética × analítica).
    const contasEnvolvidas = new Set<number>([...fiscalPorConta.keys(), ...realPorConta.keys()]);
    const plano = await client.query<{
      conta: number;
      classif: string;
      descr: string | null;
      tipoconta: number;
    }>(
      `select contactb conta, classifconta classif, descrconta descr, tipoconta
         from planoespec where codigoempresa=$1`,
      [empresa]
    );
    const infoConta = new Map<number, { classif: string; descr: string | null; sintetica: boolean }>();
    const sinteticas = new Set<string>();
    for (const r of plano.rows) {
      infoConta.set(r.conta, {
        classif: r.classif,
        descr: r.descr,
        sintetica: r.tipoconta === 1,
      });
      if (r.tipoconta === 1) sinteticas.add(r.classif);
    }

    // Rollup: cada analítica com movimento soma nas sintéticas ancestrais (prefixo).
    const acumSint = new Map<string, { fd: number; fc: number; rd: number; rc: number }>();
    const bump = (classif: string, fd: number, fc: number, rd: number, rc: number) => {
      const a = acumSint.get(classif) ?? { fd: 0, fc: 0, rd: 0, rc: 0 };
      a.fd += fd;
      a.fc += fc;
      a.rd += rd;
      a.rc += rc;
      acumSint.set(classif, a);
    };
    for (const conta of contasEnvolvidas) {
      const info = infoConta.get(conta);
      if (!info || info.sintetica) continue; // só analítica gera movimento
      const fis = fiscalPorConta.get(conta) ?? { deb: 0, cred: 0 };
      const re = realPorConta.get(conta) ?? { deb: 0, cred: 0 };
      const seg = info.classif.split(".");
      for (let k = 1; k < seg.length; k++) {
        const prefixo = seg.slice(0, k).join(".");
        if (sinteticas.has(prefixo)) bump(prefixo, fis.deb, fis.cred, re.deb, re.cred);
      }
    }

    // Monta as linhas: sintéticas (com rollup) + analíticas (movimento próprio).
    const linhas: BalanceteLinha[] = [];
    for (const [conta, info] of infoConta) {
      const nivel = info.classif.split(".").length;
      if (info.sintetica) {
        const a = acumSint.get(info.classif);
        if (!a || (a.fd === 0 && a.fc === 0 && a.rd === 0 && a.rc === 0)) continue;
        linhas.push({
          conta,
          classif: info.classif,
          nivel,
          descricao: info.descr ?? String(conta),
          sintetica: true,
          fiscalDeb: a.fd,
          fiscalCred: a.fc,
          realDeb: a.rd,
          realCred: a.rc,
        });
      } else {
        if (!contasEnvolvidas.has(conta)) continue;
        const fis = fiscalPorConta.get(conta) ?? { deb: 0, cred: 0 };
        const re = realPorConta.get(conta) ?? { deb: 0, cred: 0 };
        if (fis.deb === 0 && fis.cred === 0 && re.deb === 0 && re.cred === 0) continue;
        linhas.push({
          conta,
          classif: info.classif,
          nivel,
          descricao: info.descr ?? String(conta),
          sintetica: false,
          fiscalDeb: fis.deb,
          fiscalCred: fis.cred,
          realDeb: re.deb,
          realCred: re.cred,
        });
      }
    }
    linhas.sort((a, b) => a.classif.localeCompare(b.classif) || a.conta - b.conta);

    return {
      linhas,
      cobertura: {
        notas: ent.notas + sai.notas,
        componentesPulados: ent.pulados + sai.pulados,
      },
      nivelMax: linhas.reduce((mx, l) => Math.max(mx, l.nivel), 1),
    } satisfies BalanceteFiscalResp;
  } finally {
    client.release();
  }
});
