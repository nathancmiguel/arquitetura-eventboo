import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
	useRouter,
} from "@tanstack/react-router";

import {
	Navegacao,
	Rodape,
	TelaMensagem,
} from "#/components/layout.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Toaster } from "#/components/ui/sonner.tsx";
import type { UsuarioSessao } from "#/repositories/contratos.ts";
import { obterUsuario } from "#/server/sessao.ts";

import appCss from "../styles.css?url";

interface ContextoRoteador {
	queryClient: QueryClient;
	usuario?: UsuarioSessao | null;
}

export const Route = createRootRouteWithContext<ContextoRoteador>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Eventboo — inscrições e presença" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", type: "image/png", href: "/eventboo-64.png" },
			{ rel: "apple-touch-icon", href: "/eventboo-192.png" },
		],
	}),
	// A sessão é lida no servidor a cada navegação e fica no contexto das rotas.
	beforeLoad: async () => ({ usuario: await obterUsuario() }),
	shellComponent: Documento,
	component: Layout,
	notFoundComponent: NaoEncontrado,
	errorComponent: ({ error }) => <TelaErro erro={error} />,
});

function Documento({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}

function Layout() {
	const { usuario } = Route.useRouteContext();
	return (
		<div className="flex min-h-screen flex-col">
			<Navegacao usuario={usuario ?? null} />
			<main className="flex-1">
				<Outlet />
			</main>
			<Rodape />
		</div>
	);
}

export function NaoEncontrado() {
	return (
		<TelaMensagem
			rotulo="Erro 404"
			titulo="Página não encontrada"
			mensagem="O endereço não existe ou o evento foi removido."
		/>
	);
}

export function TelaErro({ erro }: { erro: unknown }) {
	const router = useRouter();
	const mensagem =
		erro instanceof Error ? erro.message : "Algo deu errado do nosso lado.";
	return (
		<TelaMensagem
			rotulo="Erro"
			titulo="Algo deu errado"
			mensagem={mensagem}
			acao={
				<div className="flex flex-wrap gap-3">
					<Button onClick={() => router.invalidate()}>Tentar novamente</Button>
					<Button
						variant="outline"
						nativeButton={false}
						render={<Link to="/eventos" />}
					>
						Voltar para os eventos
					</Button>
				</div>
			}
		/>
	);
}
