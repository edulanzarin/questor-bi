import { NextRequest, NextResponse } from "next/server";
import { FilterError } from "./fiscal-filters";
import { AppDbError } from "./app-db";
import { podeAcessar } from "./sessao";
import type { ModuloId } from "./modulos";

type Handler = (req: NextRequest) => Promise<unknown>;

/**
 * A rota declara o módulo pelo próprio caminho: /api/fiscal/... e
 * /api/contabil/... Assim o gate mora num lugar só e nenhuma rota nasce
 * desprotegida — não há como esquecer de checar. (/api/empresas e afins não
 * casam: são compartilhados, liberados a qualquer sessão por enquanto.)
 */
function moduloDaRota(pathname: string): ModuloId | undefined {
  const m = pathname.match(/^\/api\/(fiscal|contabil|folha)(?:\/|$)/);
  return m ? (m[1] as ModuloId) : undefined;
}

export function apiRoute(handler: Handler) {
  return async (req: NextRequest) => {
    try {
      // Permissão se valida no servidor, sempre. Ler exige view; escrever
      // (POST/PUT/DELETE/PATCH) exige edit.
      const modulo = moduloDaRota(req.nextUrl.pathname);
      if (modulo) {
        const nivel = req.method === "GET" ? "view" : "edit";
        if (!(await podeAcessar(modulo, nivel))) {
          return NextResponse.json(
            { error: "Você não tem acesso a este módulo" },
            { status: 403 }
          );
        }
      }
      const data = await handler(req);
      return NextResponse.json(data);
    } catch (err) {
      if (err instanceof FilterError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      // Falha no banco do BI tem causa e solução próprias — não confundir com o
      // Questor, senão a mensagem manda investigar o banco errado.
      if (err instanceof AppDbError) {
        console.error("[api][bi]", err.message);
        return NextResponse.json({ error: err.message }, { status: 503 });
      }
      // Erro de conexão do pg pode ter mensagem vazia (AggregateError): sem o
      // fallback, o log sai em branco e não se descobre a causa.
      const message = err instanceof Error && err.message ? err.message : String(err);
      console.error("[api]", message);
      const friendly = message.includes("statement timeout")
        ? "A consulta demorou demais — restrinja o período ou as empresas"
        : "Falha ao consultar o banco do Questor";
      return NextResponse.json({ error: friendly }, { status: 500 });
    }
  };
}
