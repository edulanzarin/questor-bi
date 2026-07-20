import { Launcher } from "@/components/launcher";
import { MODULOS } from "@/lib/modulos";
import { getSessao } from "@/lib/sessao";

export default async function Home() {
  const sessao = await getSessao();
  // Só os ids passam para o cliente — nunca o objeto de sessão inteiro.
  const acessiveis = MODULOS.filter((m) => sessao.modulos[m.id]).map((m) => m.id);
  return <Launcher usuario={sessao.usuario.nome} acessiveis={acessiveis} />;
}
