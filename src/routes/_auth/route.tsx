import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useLocation,
} from "@tanstack/react-router";
import { z } from "zod";

import { Cabecalho } from "#/components/layout.tsx";
import { destinoSeguro } from "#/lib/carregar.ts";
import { cn } from "#/lib/utils.ts";

// Rota de layout (sem caminho na URL) das telas de autenticação: /login e /criar-conta.
// Quem já está logado não acessa essas telas: volta para a página de origem
// (parâmetro ?redirect) ou para /eventos.
export const Route = createFileRoute("/_auth")({
	// O parâmetro ?redirect vale para as duas telas filhas.
	validateSearch: z.object({ redirect: z.string().optional() }),
	beforeLoad: ({ context, search }) => {
		if (context.usuario) {
			throw redirect({ to: destinoSeguro(search.redirect) });
		}
	},
	component: LayoutAuth,
});

const aba =
	"flex-1 border-b-2 py-3 text-center text-[11px] font-bold uppercase tracking-[0.16em] transition-colors duration-200";
const abaAtiva = "border-vinho text-ink";
const abaInativa = "border-linha text-muted-foreground hover:text-vinho";

/** Layout compartilhado: cabeçalho escuro e abas "Entrar" / "Criar conta". */
function LayoutAuth() {
	const { redirect: origem } = Route.useSearch();
	const criando = useLocation({ select: (l) => l.pathname === "/criar-conta" });

	return (
		<>
			<Cabecalho
				rotulo="Eventboo, 2026"
				titulo={criando ? "Criar conta" : "Entrar"}
			/>
			<section className="block">
				<div className="container-app">
					<div className="mx-auto flex w-full max-w-md flex-col gap-8">
						<nav aria-label="Acesso" className="flex">
							<Link
								to="/login"
								search={{ redirect: origem }}
								className={cn(aba, criando ? abaInativa : abaAtiva)}
							>
								Entrar
							</Link>
							<Link
								to="/criar-conta"
								search={{ redirect: origem }}
								className={cn(aba, criando ? abaAtiva : abaInativa)}
							>
								Criar conta
							</Link>
						</nav>
						<Outlet />
					</div>
				</div>
			</section>
		</>
	);
}
