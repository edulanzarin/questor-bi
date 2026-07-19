import { NextRequest, NextResponse } from "next/server";
import { FilterError } from "./fiscal-filters";
import { AppDbError } from "./app-db";

type Handler = (req: NextRequest) => Promise<unknown>;

export function apiRoute(handler: Handler) {
  return async (req: NextRequest) => {
    try {
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
