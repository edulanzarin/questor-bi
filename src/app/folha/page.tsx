import { redirect } from "next/navigation";
import { getSessao, primeiraSecaoPath } from "@/lib/sessao";

export default async function FolhaIndex({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") usp.set(k, v);
  }
  const qs = usp.toString();
  const home = primeiraSecaoPath(await getSessao(), "folha") ?? "/";
  redirect(`${home}${qs ? `?${qs}` : ""}`);
}
