import { createFileRoute, notFound } from "@tanstack/react-router";

import { FormularioEvento } from "#/components/formulario-evento.tsx";
import { Cabecalho } from "#/components/layout.tsx";
import { dadosOuFalha } from "#/lib/carregar.ts";
import { utcParaDataLocal } from "#/lib/datas.ts";
import { buscarEventoParaEdicao, editarEvento } from "#/server/eventos.ts";

export const Route = createFileRoute("/_private/organizador/eventos/$id/editar")({
	loader: async ({ params, location }) => {
		const eventoId = Number(params.id);
		if (!Number.isInteger(eventoId) || eventoId <= 0) throw notFound();
		return dadosOuFalha(
			await buscarEventoParaEdicao({ data: { eventoId } }),
			location.href,
		);
	},
	head: () => ({ meta: [{ title: "Editar evento — Eventboo" }] }),
	component: EditarEvento,
});

function EditarEvento() {
	const evento = Route.useLoaderData();

	return (
		<>
			<Cabecalho
				curto
				rotulo="Organizador"
				titulo="Editar evento"
				direita={
					<span className="label">
						{evento.inscritos} de {evento.limiteVagas} inscritos
					</span>
				}
			>
				<p className="mt-4 text-paper/70">{evento.titulo}</p>
			</Cabecalho>
			<section className="block">
				<div className="container-app">
					<FormularioEvento
						valoresIniciais={{
							titulo: evento.titulo,
							dataHora: utcParaDataLocal(evento.dataHora),
							local: evento.local,
							limiteVagas: evento.limiteVagas,
						}}
						salvar={(valores) =>
							editarEvento({ data: { ...valores, id: evento.id } })
						}
						mensagemSucesso="Evento atualizado."
					/>
				</div>
			</section>
		</>
	);
}
