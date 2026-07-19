import { apiRoute } from "@/lib/api-route";
import { FilterError } from "@/lib/fiscal-filters";
import {
  contasFaltantes,
  criarContaBanco,
  listarContasBanco,
  removerContaBanco,
  removerRegra,
  replicarRegras,
  salvarRegra,
  type Destino,
} from "@/lib/extrato-store";

/** Contas de banco da empresa com as regras de contrapartida do extrato. */
export const GET = apiRoute(async (req) => {
  const p = req.nextUrl.searchParams;
  const empresa = Number(p.get("empresa"));
  if (!Number.isInteger(empresa)) throw new FilterError("Selecione uma empresa");

  // Prévia da replicação: quais contas não existem no plano do destino.
  const origem = p.get("faltantesDe");
  const destino = p.get("faltantesEm");
  if (origem && destino) {
    const o = Number(origem);
    const d = Number(destino);
    if (!Number.isInteger(o) || !Number.isInteger(d)) throw new FilterError("Parâmetros inválidos");
    return { faltantes: await contasFaltantes(o, d) };
  }

  return await listarContasBanco(empresa);
});

interface Corpo {
  acao?: "conta" | "regra" | "replicar";
  // conta de banco
  empresa?: number;
  conta?: number;
  apelido?: string | null;
  // regra
  id?: number;
  contaBancoId?: number;
  termo?: string;
  tipo?: string;
  contaPagamento?: number | null;
  contaRecebimento?: number | null;
  historico?: string | null;
  ativo?: boolean;
  // replicação
  origemId?: number;
  destinos?: Destino[];
}

export const POST = apiRoute(async (req) => {
  const c = (await req.json()) as Corpo;

  if (c.acao === "conta") {
    if (!Number.isInteger(c.empresa) || !Number.isInteger(c.conta)) {
      throw new FilterError("Informe a empresa e a conta do banco");
    }
    const id = await criarContaBanco(c.empresa!, c.conta!, c.apelido?.trim() || null);
    return { id, ok: true };
  }

  if (c.acao === "replicar") {
    if (!Number.isInteger(c.origemId) || !c.destinos?.length) {
      throw new FilterError("Escolha ao menos um destino para replicar");
    }
    for (const d of c.destinos) {
      if (!Number.isInteger(d.empresa) || !Number.isInteger(d.conta)) {
        throw new FilterError("Destino inválido");
      }
    }
    return { resultado: await replicarRegras(c.origemId!, c.destinos), ok: true };
  }

  // padrão: salvar regra
  if (!Number.isInteger(c.contaBancoId)) throw new FilterError("Conta de banco não informada");
  const termo = (c.termo ?? "").trim();
  if (!termo) throw new FilterError("Informe o termo a procurar na descrição");
  if (c.tipo !== "exato" && c.tipo !== "parcial") throw new FilterError("Tipo inválido");
  if (c.contaPagamento == null && c.contaRecebimento == null) {
    throw new FilterError("Informe a conta de pagamento, a de recebimento, ou as duas");
  }

  const id = await salvarRegra({
    id: c.id,
    contaBancoId: c.contaBancoId!,
    termo,
    tipo: c.tipo,
    contaPagamento: c.contaPagamento ?? null,
    contaRecebimento: c.contaRecebimento ?? null,
    historico: c.historico?.trim() || null,
    ativo: c.ativo ?? true,
  });
  return { id, ok: true };
});

export const DELETE = apiRoute(async (req) => {
  const p = req.nextUrl.searchParams;
  const regra = p.get("regra");
  const conta = p.get("contaBanco");

  if (regra) {
    const id = Number(regra);
    if (!Number.isInteger(id)) throw new FilterError("Regra inválida");
    return { ok: await removerRegra(id) };
  }
  if (conta) {
    const id = Number(conta);
    if (!Number.isInteger(id)) throw new FilterError("Conta inválida");
    // Apagar a conta leva junto as regras dela (cascade).
    return { ok: await removerContaBanco(id) };
  }
  throw new FilterError("Informe o que remover");
});
