import { apiRoute } from "@/lib/api-route";
import { buscarNotaItens } from "@/lib/nota-itens";

/** Itens de uma nota — detalhe da Conferência. Mesma consulta do Fiscal, mas
 * servida pelo módulo Contábil (gate por caminho no apiRoute). */
export const GET = apiRoute((req) => buscarNotaItens(req.nextUrl.searchParams));
