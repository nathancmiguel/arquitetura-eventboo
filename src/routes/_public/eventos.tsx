import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Cabecalho } from "#/components/layout.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";
import { dadosOuFalha } from "#/lib/carregar.ts";
import { formatarDataHora } from "#/lib/datas.ts";
import { useTratarResultado } from "#/lib/tratar-resultado.tsx";
import type { EventoResumo, UsuarioSessao } from "#/repositories/contratos.ts";
import { listarEventos } from "#/server/eventos.ts";
import { inscrever } from "#/server/inscricoes.ts";

export const Route = createFileRoute("/_public/eventos")({
	loader: async ({ location }) =>
		dadosOuFalha(await listarEventos(), location.href),
	head: () => ({ meta: [{ title: "Próximos eventos — Eventboo" }] }),
	component: Eventos,
});

function Eventos() {
	const eventos = Route.useLoaderData();
	const { usuario } = Route.useRouteContext();
	const total = eventos.length;

	return (
		<>
			<Cabecalho
				curto
				rotulo="Agenda"
				titulo="Próximos eventos"
				direita={
					<span className="label">
						{total} {total === 1 ? "evento" : "eventos"}
					</span>
				}
			>
				<p className="mt-4 max-w-xl text-paper/70">
					Veja os eventos abertos e garanta sua vaga.
				</p>
			</Cabecalho>

			<section className="block">
				<div className="container-app">
					{total === 0 ? (
						<p className="text-muted-foreground">
							Nenhum evento futuro por enquanto.
						</p>
					) : (
						<ul className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-3">
							{eventos.map((evento, i) => (
								<CardEvento
									key={evento.id}
									evento={evento}
									indice={i + 1}
									total={total}
									usuario={usuario ?? null}
								/>
							))}
						</ul>
					)}
				</div>
			</section>
		</>
	);
}

/** Card no estilo dos "trabalhos" da landing: sem moldura, só linhas finas. */
function CardEvento({
	evento,
	indice,
	total,
	usuario,
}: {
	evento: EventoResumo;
	indice: number;
	total: number;
	usuario: UsuarioSessao | null;
}) {
	const esgotado = evento.vagasRestantes <= 0;

	return (
		<li className="flex flex-col gap-4 border-t border-linha pt-6">
			<span className="num">
				{String(indice).padStart(2, "0")} / {String(total).padStart(2, "0")}
			</span>
			<h2 className="text-xl">{evento.titulo}</h2>
			<p className="label">
				{formatarDataHora(evento.dataHora)} — {evento.local}
			</p>
			<div>
				{esgotado ? (
					<Badge className="text-muted-foreground">Esgotado</Badge>
				) : (
					<Badge>
						<strong className="font-extrabold text-vinho">
							{evento.vagasRestantes}
						</strong>
						{evento.vagasRestantes === 1 ? "vaga restante" : "vagas restantes"}
					</Badge>
				)}
			</div>
			<div className="mt-auto flex flex-wrap gap-3 pt-2">
				<AcoesEvento evento={evento} usuario={usuario} esgotado={esgotado} />
			</div>
		</li>
	);
}

function AcoesEvento({
	evento,
	usuario,
	esgotado,
}: {
	evento: EventoResumo;
	usuario: UsuarioSessao | null;
	esgotado: boolean;
}) {
	const tratar = useTratarResultado();
	const navigate = useNavigate();
	const [enviando, setEnviando] = useState(false);

	// Organizador: editar e ver inscritos (o servidor confere o perfil de novo).
	if (usuario?.role === "organizador") {
		return (
			<>
				<Button
					nativeButton={false}
					render={
						<Link
							to="/organizador/eventos/$id/inscritos"
							params={{ id: String(evento.id) }}
						/>
					}
				>
					Ver inscritos
				</Button>
				<Button
					variant="outline"
					nativeButton={false}
					render={
						<Link
							to="/organizador/eventos/$id/editar"
							params={{ id: String(evento.id) }}
						/>
					}
				>
					Editar
				</Button>
			</>
		);
	}

	if (evento.minhaInscricaoId !== null) {
		return (
			<Button variant="outline" disabled className="w-full">
				Inscrito
			</Button>
		);
	}

	if (esgotado) {
		return (
			<Button variant="outline" disabled className="w-full">
				Esgotado
			</Button>
		);
	}

	async function aoInscrever() {
		// Visitante vai para o login e volta para cá depois.
		if (!usuario) {
			await navigate({ to: "/login", search: { redirect: "/eventos" } });
			return;
		}
		setEnviando(true);
		await tratar(await inscrever({ data: { eventoId: evento.id } }), {
			sucesso: `Inscrição confirmada: ${evento.titulo}`,
		});
		setEnviando(false);
	}

	return (
		<Button className="w-full" onClick={aoInscrever} disabled={enviando}>
			{enviando && <Spinner />}
			{enviando ? "Inscrevendo…" : "Inscrever-se"}
		</Button>
	);
}
