import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

// Rota de layout (sem caminho na URL) que protege todas as páginas privadas.
// Quem não está logado vai para /login, guardando a página de origem para voltar.
//
// Isto é só a experiência de navegação: a segurança de verdade continua nos
// serviços, que conferem a sessão e o perfil a cada chamada no servidor.
export const Route = createFileRoute("/_private")({
	beforeLoad: ({ context, location }) => {
		if (!context.usuario) {
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}
		// Daqui para baixo o usuário existe: os filhos recebem o tipo já sem null.
		return { usuario: context.usuario };
	},
	component: Outlet,
});
