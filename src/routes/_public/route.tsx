import { createFileRoute, Outlet } from "@tanstack/react-router";

// Rota de layout (sem caminho na URL) das páginas públicas:
// qualquer visitante acessa, logado ou não.
export const Route = createFileRoute("/_public")({
	component: Outlet,
});
