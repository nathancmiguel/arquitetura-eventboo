import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { TelaMensagem } from "#/components/layout.tsx";

// Guarda de UX para as telas do organizador. A segurança de verdade está nos
// serviços (exigirOrganizador), que conferem o perfil a cada chamada no servidor.
export const Route = createFileRoute("/organizador")({
	beforeLoad: ({ context, location }) => {
		if (!context.usuario) {
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}
	},
	component: AreaOrganizador,
});

function AreaOrganizador() {
	const { usuario } = Route.useRouteContext();
	if (usuario?.role !== "organizador") {
		return (
			<TelaMensagem
				rotulo="Acesso restrito"
				titulo="Sem permissão"
				mensagem="Você não tem permissão para fazer isso."
				codigo="SEM_PERMISSAO"
			/>
		);
	}
	return <Outlet />;
}
