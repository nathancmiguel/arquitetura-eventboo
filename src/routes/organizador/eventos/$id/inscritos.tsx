import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Cabecalho } from "#/components/layout.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Checkbox } from "#/components/ui/checkbox.tsx";
import { dadosOuFalha } from "#/lib/carregar.ts";
import { formatarDataHora } from "#/lib/datas.ts";
import { useTratarResultado } from "#/lib/tratar-resultado.tsx";
import { cn } from "#/lib/utils.ts";
import type { Inscrito } from "#/repositories/contratos.ts";
import { listarInscritos, marcarPresenca } from "#/server/presenca.ts";

export const Route = createFileRoute("/organizador/eventos/$id/inscritos")({
	validateSearch: z.object({ pagina: z.number().int().min(1).catch(1).default(1) }),
	loaderDeps: ({ search }) => ({ pagina: search.pagina }),
	loader: async ({ params, deps, location }) => {
		const eventoId = Number(params.id);
		if (!Number.isInteger(eventoId) || eventoId <= 0) throw notFound();
		// RNF2: a página é buscada no servidor (8 por página, LIMIT/OFFSET).
		return dadosOuFalha(
			await listarInscritos({ data: { eventoId, pagina: deps.pagina } }),
			location.href,
		);
	},
	head: () => ({ meta: [{ title: "Inscritos e presença — Eventboo" }] }),
	component: Inscritos,
});

function Inscritos() {
	const dados = Route.useLoaderData();
	const { evento, inscritos, total, presentes, pagina, porPagina, totalPaginas } =
		dados;
	const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
	const fim = Math.min(pagina * porPagina, total);

	return (
		<>
			<Cabecalho
				curto
				rotulo="Organizador"
				titulo="Inscritos e presença"
				direita={
					<nav aria-label="Trilha" className="label flex gap-2">
						<Link to="/eventos" className="hover:!text-paper">
							Eventos
						</Link>
						<span aria-hidden>›</span>
						<span className="!text-paper">{evento.titulo}</span>
					</nav>
				}
			>
				<p className="mt-4 text-paper/70">
					{evento.titulo} · {formatarDataHora(evento.dataHora)} · {evento.local}
				</p>
				<dl className="mt-10 flex gap-12 border-t border-paper/15 pt-6">
					<div>
						<dt className="label">Inscritos</dt>
						<dd className="text-3xl font-extrabold">
							{total} <span className="text-paper/50">de {evento.limiteVagas}</span>
						</dd>
					</div>
					<div>
						<dt className="label">Presentes</dt>
						<dd className="text-3xl font-extrabold">{presentes}</dd>
					</div>
				</dl>
			</Cabecalho>

			<section className="block">
				<div className="container-app">
					{total === 0 ? (
						<p className="text-muted-foreground">Ninguém se inscreveu ainda.</p>
					) : (
						<>
							<div className="label hidden grid-cols-[56px_1fr_1fr_96px] gap-6 pb-3 md:grid">
								<span>Nº</span>
								<span>Nome</span>
								<span>E-mail</span>
								<span className="text-right">Presença</span>
							</div>
							<ol className="lista">
								{inscritos.map((inscrito, i) => (
									<LinhaInscrito
										key={inscrito.inscricaoId}
										inscrito={inscrito}
										numero={inicio + i}
									/>
								))}
							</ol>
							<Paginacao
								eventoId={evento.id}
								pagina={pagina}
								totalPaginas={totalPaginas}
								resumo={`Mostrando ${inicio}–${fim} de ${total}`}
							/>
						</>
					)}
				</div>
			</section>
		</>
	);
}

function LinhaInscrito({ inscrito, numero }: { inscrito: Inscrito; numero: number }) {
	const tratar = useTratarResultado();
	const [enviando, setEnviando] = useState(false);
	const idCheckbox = `presenca-${inscrito.inscricaoId}`;

	async function aoMarcar(presente: boolean) {
		setEnviando(true);
		await tratar(
			await marcarPresenca({
				data: { inscricaoId: inscrito.inscricaoId, presente },
			}),
			{
				sucesso: presente
					? `Presença marcada: ${inscrito.nome}`
					: `Presença desmarcada: ${inscrito.nome}`,
			},
		);
		setEnviando(false);
	}

	return (
		<li className="grid grid-cols-[40px_1fr_auto] items-center gap-x-4 py-4 md:grid-cols-[56px_1fr_1fr_96px] md:gap-6">
			<span className="num">{String(numero).padStart(2, "0")}</span>
			<label htmlFor={idCheckbox} className="flex min-w-0 flex-col md:contents">
				<span className="truncate font-bold">{inscrito.nome}</span>
				<span className="truncate text-sm text-muted-foreground md:text-ink">
					{inscrito.email}
				</span>
			</label>
			<span className="flex justify-end">
				<Checkbox
					id={idCheckbox}
					checked={inscrito.presente}
					disabled={enviando}
					onCheckedChange={(v) => aoMarcar(v === true)}
					aria-label={`Presença de ${inscrito.nome}`}
					className={cn("size-6", enviando && "animate-pulse")}
				/>
			</span>
		</li>
	);
}

function Paginacao({
	eventoId,
	pagina,
	totalPaginas,
	resumo,
}: {
	eventoId: number;
	pagina: number;
	totalPaginas: number;
	resumo: string;
}) {
	const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);
	const params = { id: String(eventoId) };
	const to = "/organizador/eventos/$id/inscritos" as const;

	return (
		<nav
			aria-label="Paginação"
			className="mt-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
		>
			<span className="label">{resumo}</span>
			<div className="flex flex-wrap gap-2">
				<Button
					variant="outline"
					size="icon-sm"
					disabled={pagina <= 1}
					nativeButton={false}
					aria-label="Página anterior"
					render={<Link to={to} params={params} search={{ pagina: pagina - 1 }} />}
				>
					<ChevronLeftIcon />
				</Button>
				{paginas.map((p) => (
					<Button
						key={p}
						variant={p === pagina ? "default" : "outline"}
						size="icon-sm"
						nativeButton={false}
						aria-current={p === pagina ? "page" : undefined}
						render={<Link to={to} params={params} search={{ pagina: p }} />}
					>
						{p}
					</Button>
				))}
				<Button
					variant="outline"
					size="icon-sm"
					disabled={pagina >= totalPaginas}
					nativeButton={false}
					aria-label="Próxima página"
					render={<Link to={to} params={params} search={{ pagina: pagina + 1 }} />}
				>
					<ChevronRightIcon />
				</Button>
			</div>
		</nav>
	);
}
