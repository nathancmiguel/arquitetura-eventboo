import { createFileRoute } from "@tanstack/react-router";

import { FormularioEvento } from "#/components/formulario-evento.tsx";
import { Cabecalho } from "#/components/layout.tsx";
import { criarEvento } from "#/server/eventos.ts";

export const Route = createFileRoute("/_private/organizador/eventos/novo")({
	head: () => ({ meta: [{ title: "Novo evento — Eventboo" }] }),
	component: NovoEvento,
});

function NovoEvento() {
	return (
		<>
			<Cabecalho curto rotulo="Organizador" titulo="Novo evento">
				<p className="mt-4 text-paper/70">
					Preencha os dados para abrir as inscrições.
				</p>
			</Cabecalho>
			<section className="block">
				<div className="container-app">
					<FormularioEvento
						valoresIniciais={{
							titulo: "",
							dataHora: "",
							local: "",
							limiteVagas: 30,
						}}
						salvar={(valores) => criarEvento({ data: valores })}
						mensagemSucesso="Evento criado."
					/>
				</div>
			</section>
		</>
	);
}
