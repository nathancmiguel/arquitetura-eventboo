import { createFileRoute, redirect } from "@tanstack/react-router";

// A página inicial é a lista de eventos.
export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({ to: "/eventos" });
	},
});
