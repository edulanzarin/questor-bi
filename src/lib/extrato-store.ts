import { appPool, appQuery, erroAppDb } from "./app-db";
import { FilterError } from "./fiscal-filters";
import { pool } from "./db";
import { normalizar, type TipoRegra } from "./regras-extrato";
import type { ContaBanco, RegraExtratoDTO } from "./types";

interface ContaRow {
  id: number;
  codigo_empresa: number;
  conta: number;
  apelido: string | null;
}

interface RegraRow {
  id: number;
  conta_banco_id: number;
  termo: string;
  termo_original: string;
  tipo: TipoRegra;
  conta_pagamento: number | null;
  conta_recebimento: number | null;
  historico: string | null;
  ativo: boolean;
}

/**
 * Contas de banco cadastradas da empresa com as suas regras. As descrições das
 * contas vêm do plano do Questor — aqui só guardamos os números, então é
 * preciso ir buscar lá para a tela mostrar nome em vez de código.
 */
export async function listarContasBanco(empresa: number): Promise<ContaBanco[]> {
  const contas = await appQuery<ContaRow>(
    `select id, codigo_empresa, conta, apelido from conf_conta_banco
      where codigo_empresa = $1 order by conta`,
    [empresa]
  );
  if (!contas.length) return [];

  const regras = await appQuery<RegraRow>(
    `select id, conta_banco_id, termo, termo_original, tipo, conta_pagamento,
            conta_recebimento, historico, ativo
       from conf_regra_extrato
      where conta_banco_id = any($1::int[])
      order by (tipo = 'exato') desc, length(termo) desc, termo`,
    [contas.map((c) => c.id)]
  );

  // Uma consulta só para todas as contas envolvidas (banco + contrapartidas).
  const numeros = new Set<number>();
  for (const c of contas) numeros.add(c.conta);
  for (const r of regras) {
    if (r.conta_pagamento != null) numeros.add(r.conta_pagamento);
    if (r.conta_recebimento != null) numeros.add(r.conta_recebimento);
  }
  const plano = await descreverContas(empresa, [...numeros]);

  const porConta = new Map<number, RegraExtratoDTO[]>();
  for (const r of regras) {
    const dto: RegraExtratoDTO = {
      id: r.id,
      termo: r.termo,
      termoOriginal: r.termo_original,
      tipo: r.tipo,
      contaPagamento: r.conta_pagamento,
      contaRecebimento: r.conta_recebimento,
      descrPagamento: r.conta_pagamento != null ? (plano.get(r.conta_pagamento) ?? null) : null,
      descrRecebimento:
        r.conta_recebimento != null ? (plano.get(r.conta_recebimento) ?? null) : null,
      historico: r.historico,
      ativo: r.ativo,
    };
    const lista = porConta.get(r.conta_banco_id);
    if (lista) lista.push(dto);
    else porConta.set(r.conta_banco_id, [dto]);
  }

  return contas.map((c) => ({
    id: c.id,
    empresa: c.codigo_empresa,
    conta: c.conta,
    apelido: c.apelido,
    descricao: plano.get(c.conta) ?? null,
    classificacao: null,
    regras: porConta.get(c.id) ?? [],
  }));
}

async function descreverContas(empresa: number, contas: number[]): Promise<Map<number, string>> {
  if (!contas.length) return new Map();
  const { rows } = await pool.query<{ contactb: number; descrconta: string }>(
    `select contactb, btrim(descrconta) descrconta from planoespec
      where codigoempresa = $1 and contactb = any($2::bigint[])`,
    [empresa, contas]
  );
  return new Map(rows.map((r) => [r.contactb, r.descrconta]));
}

export async function criarContaBanco(
  empresa: number,
  conta: number,
  apelido: string | null
): Promise<number> {
  const rows = await appQuery<{ id: number }>(
    `insert into conf_conta_banco (codigo_empresa, conta, apelido) values ($1, $2, $3)
     on conflict (codigo_empresa, conta) do update set apelido = excluded.apelido
     returning id`,
    [empresa, conta, apelido]
  );
  return rows[0].id;
}

export async function removerContaBanco(id: number): Promise<boolean> {
  const rows = await appQuery<{ id: number }>(
    "delete from conf_conta_banco where id = $1 returning id",
    [id]
  );
  return rows.length > 0;
}

export interface SalvarRegra {
  id?: number;
  contaBancoId: number;
  termo: string;
  tipo: TipoRegra;
  contaPagamento: number | null;
  contaRecebimento: number | null;
  historico: string | null;
  ativo: boolean;
}

/**
 * Impede regra apontando para conta que não existe no plano da empresa. Sem
 * isto, um dígito errado passa batido e só aparece quando o Questor recusar o
 * arquivo de importação — longe demais da causa.
 */
async function validarContas(contaBancoId: number, contas: (number | null)[]): Promise<void> {
  const alvo = contas.filter((c): c is number => c != null);
  if (!alvo.length) return;

  const dono = await appQuery<{ codigo_empresa: number }>(
    "select codigo_empresa from conf_conta_banco where id = $1",
    [contaBancoId]
  );
  if (!dono.length) throw new FilterError("Conta de banco não encontrada");

  const { rows } = await pool.query<{ contactb: number }>(
    `select contactb from planoespec
      where codigoempresa = $1 and tipoconta = 2 and contactb = any($2::bigint[])`,
    [dono[0].codigo_empresa, alvo]
  );
  const existem = new Set(rows.map((x) => x.contactb));
  const faltando = alvo.filter((c) => !existem.has(c));
  if (faltando.length) {
    throw new FilterError(
      `Conta ${faltando.join(", ")} não existe no plano desta empresa (ou não é analítica)`
    );
  }
}

export async function salvarRegra(r: SalvarRegra): Promise<number> {
  await validarContas(r.contaBancoId, [r.contaPagamento, r.contaRecebimento]);
  const termo = normalizar(r.termo);
  const params = [
    r.contaBancoId,
    termo,
    r.termo.trim(),
    r.tipo,
    r.contaPagamento,
    r.contaRecebimento,
    r.historico,
    r.ativo,
  ];

  if (r.id) {
    const rows = await appQuery<{ id: number }>(
      `update conf_regra_extrato
          set conta_banco_id = $1, termo = $2, termo_original = $3, tipo = $4,
              conta_pagamento = $5, conta_recebimento = $6, historico = $7, ativo = $8
        where id = $9 returning id`,
      [...params, r.id]
    );
    return rows[0]?.id ?? r.id;
  }

  const rows = await appQuery<{ id: number }>(
    `insert into conf_regra_extrato
       (conta_banco_id, termo, termo_original, tipo, conta_pagamento, conta_recebimento,
        historico, ativo)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (conta_banco_id, termo, tipo) do update
       set conta_pagamento = excluded.conta_pagamento,
           conta_recebimento = excluded.conta_recebimento,
           historico = excluded.historico,
           ativo = excluded.ativo,
           termo_original = excluded.termo_original
     returning id`,
    params
  );
  return rows[0].id;
}

export async function removerRegra(id: number): Promise<boolean> {
  const rows = await appQuery<{ id: number }>(
    "delete from conf_regra_extrato where id = $1 returning id",
    [id]
  );
  return rows.length > 0;
}

export interface Destino {
  empresa: number;
  conta: number;
}

export interface ResultadoReplica {
  destino: Destino;
  criadas: number;
  atualizadas: number;
}

/**
 * Copia as regras de uma conta de banco para outras contas — da mesma empresa
 * ou de outras. É o caminho para não recadastrar o mesmo plano em cada empresa.
 *
 * As contas de contrapartida são copiadas COMO ESTÃO: o plano de contas é por
 * empresa, então replicar para outra empresa só faz sentido quando os planos
 * são iguais (o que é comum num escritório, que usa plano padrão). A tela
 * avisa disso e mostra quais contas não existem no destino.
 */
export async function replicarRegras(
  origemId: number,
  destinos: Destino[]
): Promise<ResultadoReplica[]> {
  const client = await appPool.connect().catch((err) => {
    throw erroAppDb(err);
  });
  try {
    await client.query("begin");
    const { rows: regras } = await client.query<RegraRow>(
      `select termo, termo_original, tipo, conta_pagamento, conta_recebimento, historico, ativo
         from conf_regra_extrato where conta_banco_id = $1`,
      [origemId]
    );

    const resultado: ResultadoReplica[] = [];
    for (const d of destinos) {
      const { rows: alvo } = await client.query<{ id: number }>(
        `insert into conf_conta_banco (codigo_empresa, conta) values ($1, $2)
         on conflict (codigo_empresa, conta) do update set conta = excluded.conta
         returning id`,
        [d.empresa, d.conta]
      );
      const alvoId = alvo[0].id;

      let criadas = 0;
      let atualizadas = 0;
      for (const r of regras) {
        const { rows } = await client.query<{ inserido: boolean }>(
          `insert into conf_regra_extrato
             (conta_banco_id, termo, termo_original, tipo, conta_pagamento,
              conta_recebimento, historico, ativo)
           values ($1, $2, $3, $4, $5, $6, $7, $8)
           on conflict (conta_banco_id, termo, tipo) do update
             set conta_pagamento = excluded.conta_pagamento,
                 conta_recebimento = excluded.conta_recebimento,
                 historico = excluded.historico
           returning (xmax = 0) as inserido`,
          [
            alvoId,
            r.termo,
            r.termo_original,
            r.tipo,
            r.conta_pagamento,
            r.conta_recebimento,
            r.historico,
            r.ativo,
          ]
        );
        if (rows[0]?.inserido) criadas += 1;
        else atualizadas += 1;
      }
      resultado.push({ destino: d, criadas, atualizadas });
    }

    await client.query("commit");
    return resultado;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw erroAppDb(err);
  } finally {
    client.release();
  }
}

/** Contas de contrapartida das regras que NÃO existem no plano do destino. */
export async function contasFaltantes(
  origemId: number,
  empresaDestino: number
): Promise<number[]> {
  const regras = await appQuery<{ conta_pagamento: number | null; conta_recebimento: number | null }>(
    "select conta_pagamento, conta_recebimento from conf_regra_extrato where conta_banco_id = $1",
    [origemId]
  );
  const usadas = new Set<number>();
  for (const r of regras) {
    if (r.conta_pagamento != null) usadas.add(r.conta_pagamento);
    if (r.conta_recebimento != null) usadas.add(r.conta_recebimento);
  }
  if (!usadas.size) return [];

  const { rows } = await pool.query<{ contactb: number }>(
    `select contactb from planoespec
      where codigoempresa = $1 and tipoconta = 2 and contactb = any($2::bigint[])`,
    [empresaDestino, [...usadas]]
  );
  const existentes = new Set(rows.map((r) => r.contactb));
  return [...usadas].filter((c) => !existentes.has(c)).sort((a, b) => a - b);
}
