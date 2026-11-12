import { Link } from "@tanstack/react-router";

import { cn } from "#/lib/utils.ts";

import { Cabecalho } from "./layout.tsx";

const aba =
	"flex-1 border-b-2 py-3 text-center text-[11px] font-bold uppercase tracking-[0.16em] transition-colors duration-200";

/** Layout compartilhado por /login e /criar-conta, com as abas visuais. */
export function LayoutAuth({
	modo,
	redirect,
	children,
}: {
	modo: "entrar" | "criar";
	redirect?: string;
	children: React.ReactNode;
}) {
	return (
		<>
			<Cabecalho
				rotulo="Eventboo, 2026"
				titulo={modo === "entrar" ? "Entrar" : "Criar conta"}
			/>
			<section className="block">
				<div className="container-app">
					<div className="mx-auto flex w-full max-w-md flex-col gap-8">
						<nav aria-label="Acesso" className="flex">
							<Link
								to="/login"
								search={{ redirect }}
								className={cn(
									aba,
									modo === "entrar"
										? "border-vinho text-ink"
										: "border-linha text-muted-foreground hover:text-vinho",
								)}
							>
								Entrar
							</Link>
							<Link
								to="/criar-conta"
								search={{ redirect }}
								className={cn(
									aba,
									modo === "criar"
										? "border-vinho text-ink"
										: "border-linha text-muted-foreground hover:text-vinho",
								)}
							>
								Criar conta
							</Link>
						</nav>
						{children}
					</div>
				</div>
			</section>
		</>
	);
}
