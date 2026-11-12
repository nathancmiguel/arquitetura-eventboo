import { createFileRoute, Outlet } from "@tanstack/react-router";

import { TelaMensagem } from "#/components/layout.tsx";
import { ErroDeCarregamento } from "#/lib/carregar.ts";

// Dentro de _private o usuário já está logado (checado em _private/route.tsx).
// Aqui só conferimos o perfil: participante não entra na área do organizador.
// A segurança de verdade continua nos serviços (exigirOrganizador), no servidor.
export const Route = createFileRoute("/_private/organizador")({
	beforeLoad: ({ context }) => {
		if (context.usuario.role !== "organizador") {
			// Interrompe antes dos loaders e mostra a tela de erro com o código.
			throw new ErroDeCarregamento(
				"Você não tem permissão para fazer isso.",
				"SEM_PERMISSAO",
			);
		}
	},
	component: Outlet,
	// Mostra o erro dentro do layout (com a barra de navegação), não na tela inteira.
	errorComponent: ({ error }) => {
		const mensagem =
			error instanceof Error ? error.message : "Algo deu errado do nosso lado.";
		return mensagem.includes("SEM_PERMISSAO") ? (
			<TelaMensagem
				rotulo="Acesso restrito"
				titulo="Sem permissão"
				mensagem="Esta área é só para o organizador."
				codigo="SEM_PERMISSAO"
			/>
		) : (
			<TelaMensagem rotulo="Erro" titulo="Algo deu errado" mensagem={mensagem} />
		);
	},
});
