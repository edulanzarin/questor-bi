import { NextRequest, NextResponse } from "next/server";
import { FilterError } from "./fiscal-filters";

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
      const message = err instanceof Error ? err.message : "Erro inesperado";
      console.error("[api]", message);
      const friendly = message.includes("statement timeout")
        ? "A consulta demorou demais — restrinja o período ou as empresas"
        : "Falha ao consultar o banco do Questor";
      return NextResponse.json({ error: friendly }, { status: 500 });
    }
  };
}
