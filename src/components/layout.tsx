import { Link, useRouter } from "@tanstack/react-router";
import { MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button.tsx";
import type { UsuarioSessao } from "#/repositories/contratos.ts";
import { sair } from "#/server/auth.ts";

const classeLink =
	"label !text-paper/60 border-b-2 border-transparent py-1 transition-colors duration-200 hover:!text-paper";
const classeAtivo = "!text-paper !border-vinho";

/** Barra de navegação escura: marca, links por perfil, nome do usuário e Sair. */
export function Navegacao({ usuario }: { usuario: UsuarioSessao | null }) {
	const router = useRouter();
	const [aberto, setAberto] = useState(false);

	async function aoSair() {
		await sair();
		await router.invalidate();
		await router.navigate({ to: "/login" });
	}

	const links = (
		<>
			<Link
				to="/eventos"
				className={classeLink}
				activeProps={{ className: classeAtivo }}
				onClick={() => setAberto(false)}
			>
				Eventos
			</Link>
			{usuario?.role === "participante" && (
				<Link
					to="/minhas-inscricoes"
					className={classeLink}
					activeProps={{ className: classeAtivo }}
					onClick={() => setAberto(false)}
				>
					Minhas inscrições
				</Link>
			)}
			{usuario?.role === "organizador" && (
				<Link
					to="/organizador/eventos/novo"
					className={classeLink}
					activeProps={{ className: classeAtivo }}
					onClick={() => setAberto(false)}
				>
					Novo evento
				</Link>
			)}
		</>
	);

	const conta = usuario ? (
		<>
			<span className="label !text-paper/60">
				Olá, <span className="!text-paper">{usuario.nome}</span>
			</span>
			<Button
				variant="outline"
				size="sm"
				onClick={aoSair}
				className="border-paper/30 text-paper hover:border-paper hover:text-paper"
			>
				Sair
			</Button>
		</>
	) : (
		<Link to="/login" className={classeLink}>
			Entrar
		</Link>
	);

	return (
		<header className="bg-ink text-paper">
			<nav
				aria-label="Principal"
				className="container-app flex h-16 items-center justify-between gap-6 border-b border-paper/15"
			>
				<div className="flex items-center gap-8">
					<Link to="/eventos" className="flex items-center gap-3" aria-label="Eventboo, início">
						<Logo />
						<span className="text-base font-extrabold tracking-tight">
							Eventboo<span className="ponto">.</span>
						</span>
					</Link>
					<div className="hidden items-center gap-6 md:flex">{links}</div>
				</div>
				<div className="hidden items-center gap-4 md:flex">{conta}</div>
				<button
					type="button"
					className="text-paper md:hidden"
					aria-label={aberto ? "Fechar menu" : "Abrir menu"}
					aria-expanded={aberto}
					onClick={() => setAberto((v) => !v)}
				>
					{aberto ? <XIcon /> : <MenuIcon />}
				</button>
			</nav>
			{aberto && (
				<div className="container-app flex flex-col items-start gap-4 border-b border-paper/15 py-5 md:hidden">
					{links}
					<div className="flex w-full items-center justify-between gap-4 border-t border-paper/15 pt-4">
						{conta}
					</div>
				</div>
			)}
		</header>
	);
}

/** Mini logo do Eventboo dentro do quadrado (mark). */
export function Logo() {
	return (
		<span className="mark mark--logo">
			<img src="/eventboo-64.png" alt="" width={32} height={32} />
		</span>
	);
}

/** Cabeçalho escuro com rótulo, título terminado em ponto vinho e conteúdo extra. */
export function Cabecalho({
	rotulo,
	titulo,
	direita,
	curto = false,
	children,
}: {
	rotulo: string;
	titulo: string;
	direita?: React.ReactNode;
	curto?: boolean;
	children?: React.ReactNode;
}) {
	return (
		<section className={curto ? "hero hero--curto" : "hero"}>
			<div className="container-app">
				<div className="hero-topo">
					<span className="label">{rotulo}</span>
					{direita ?? <Logo />}
				</div>
				<h1>
					{titulo}
					<span className="ponto">.</span>
				</h1>
				{children}
			</div>
		</section>
	);
}

export function Rodape() {
	return (
		<footer className="rodape container-app">
			Eventboo · Inscrições e presença · Arquitetura e Projeto de Software
		</footer>
	);
}

/** Tela de erro / não encontrado no mesmo visual. */
export function TelaMensagem({
	rotulo,
	titulo,
	mensagem,
	codigo,
	acao,
}: {
	rotulo: string;
	titulo: string;
	mensagem: string;
	codigo?: string;
	acao?: React.ReactNode;
}) {
	return (
		<>
			<Cabecalho rotulo={rotulo} titulo={titulo} />
			<section className="block">
				<div className="container-app flex max-w-xl flex-col items-start gap-6">
					<p className="text-lg">{mensagem}</p>
					{codigo && <p className="label">Código: {codigo}</p>}
					{acao ?? (
						<Button nativeButton={false} render={<Link to="/eventos" />}>Voltar para os eventos</Button>
					)}
				</div>
			</section>
		</>
	);
}
