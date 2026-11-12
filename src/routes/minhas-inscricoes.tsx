import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { Cabecalho } from "#/components/layout.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";
import { dadosOuFalha } from "#/lib/carregar.ts";
import { formatarDataHora } from "#/lib/datas.ts";
import { useTratarResultado } from "#/lib/tratar-resultado.tsx";
import type { MinhaInscricao } from "#/repositories/contratos.ts";
import { cancelarInscricao, minhasInscricoes } from "#/server/inscricoes.ts";

export const Route = createFileRoute("/minhas-inscricoes")({
	beforeLoad: ({ context, location }) => {
		if (!context.usuario) {
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}
	},
	loader: async ({ location }) =>
		dadosOuFalha(await minhasInscricoes(), location.href),
	head: () => ({ meta: [{ title: "Minhas inscrições — Eventboo" }] }),
	component: MinhasInscricoes,
});

function MinhasInscricoes() {
	const inscricoes = Route.useLoaderData();

	return (
		<>
			<Cabecalho
				curto
				rotulo="Participante"
				titulo="Minhas inscrições"
				direita={<span className="label">{inscricoes.length} no total</span>}
			>
				<p className="mt-4 text-paper/70">Eventos em que você está inscrito.</p>
			</Cabecalho>

			<section className="block">
				<div className="container-app">
					{inscricoes.length === 0 ? (
						<div className="flex flex-col items-start gap-6">
							<p className="text-muted-foreground">
								Você ainda não se inscreveu em nenhum evento.
							</p>
							<Button nativeButton={false} render={<Link to="/eventos" />}>
								Ver eventos
							</Button>
						</div>
					) : (
						<>
							<div className="label hidden grid-cols-[56px_2fr_1.2fr_1fr_auto] gap-6 pb-3 md:grid">
								<span>Nº</span>
								<span>Evento</span>
								<span>Data</span>
								<span>Local</span>
								<span className="w-44 text-right">Ação</span>
							</div>
							<ol className="lista">
								{inscricoes.map((inscricao, i) => (
									<LinhaInscricao
										key={inscricao.id}
										inscricao={inscricao}
										indice={i + 1}
									/>
								))}
							</ol>
						</>
					)}
				</div>
			</section>
		</>
	);
}

function LinhaInscricao({
	inscricao,
	indice,
}: {
	inscricao: MinhaInscricao;
	indice: number;
}) {
	const tratar = useTratarResultado();
	const [enviando, setEnviando] = useState(false);
	const { evento } = inscricao;

	async function aoCancelar() {
		setEnviando(true);
		await tratar(await cancelarInscricao({ data: { inscricaoId: inscricao.id } }), {
			sucesso: `Inscrição cancelada: ${evento.titulo}`,
		});
		setEnviando(false);
	}

	return (
		<li className="grid grid-cols-[40px_1fr] items-center gap-x-4 gap-y-2 py-5 md:grid-cols-[56px_2fr_1.2fr_1fr_auto] md:gap-6">
			<span className="num">{String(indice).padStart(2, "0")}</span>
			<span className="font-bold">{evento.titulo}</span>
			<span className="label col-start-2 md:col-start-auto md:text-sm md:normal-case md:tracking-normal md:text-ink">
				{formatarDataHora(evento.dataHora)}
				<span className="md:hidden"> · {evento.local}</span>
			</span>
			<span className="hidden text-sm md:block">{evento.local}</span>
			<Button
				variant="outline"
				size="sm"
				className="col-start-2 w-full md:col-start-auto md:w-44"
				onClick={aoCancelar}
				disabled={enviando}
			>
				{enviando && <Spinner />}
				Cancelar inscrição
			</Button>
		</li>
	);
}
