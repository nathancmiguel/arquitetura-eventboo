import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import {
	AlertaFormulario,
	errosNosCampos,
	useAppForm,
} from "#/components/formulario.tsx";
import { FieldGroup } from "#/components/ui/field.tsx";
import { destinoSeguro } from "#/lib/carregar.ts";
import { useTratarResultado } from "#/lib/tratar-resultado.tsx";
import { type LoginEntrada, loginSchema } from "#/lib/validators/auth.ts";
import { entrar } from "#/server/auth.ts";

export const Route = createFileRoute("/_auth/login")({
	// O controle de acesso (já logado não entra) e o layout ficam em _auth/route.tsx.
	head: () => ({ meta: [{ title: "Entrar — Eventboo" }] }),
	component: Login,
});

function Login() {
	const { redirect: origem } = Route.useSearch();
	const router = useRouter();
	const tratar = useTratarResultado();
	const [alerta, setAlerta] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: { email: "", senha: "" } satisfies LoginEntrada,
		validators: { onChange: loginSchema, onSubmit: loginSchema },
		onSubmit: async ({ value }) => {
			setAlerta(null);
			const dados = await tratar(await entrar({ data: value }), {
				formulario: { campos: errosNosCampos(form), alerta: setAlerta },
			});
			if (dados) {
				await router.invalidate();
				await router.navigate({ to: destinoSeguro(origem) });
			}
		},
	});

	return (
		<>
			<form
				noValidate
				className="flex flex-col gap-6"
				onSubmit={(e) => {
					e.preventDefault();
					void form.handleSubmit();
				}}
			>
				<AlertaFormulario mensagem={alerta} />
				<FieldGroup className="gap-6">
					<form.AppField name="email">
						{(f) => (
							<f.CampoTexto
								rotulo="E-mail"
								tipo="email"
								placeholder="nome@email.com"
								autoComplete="email"
							/>
						)}
					</form.AppField>
					<form.AppField name="senha">
						{(f) => (
							<f.CampoTexto
								rotulo="Senha"
								tipo="password"
								placeholder="••••••••"
								autoComplete="current-password"
							/>
						)}
					</form.AppField>
				</FieldGroup>
				<form.AppForm>
					<form.BotaoEnviar enviando="Entrando…">Entrar</form.BotaoEnviar>
				</form.AppForm>
				<p className="text-sm text-muted-foreground">
					Ainda não tem conta?{" "}
					<Link
						to="/criar-conta"
						search={{ redirect: origem }}
						className="link font-bold text-ink"
					>
						Criar conta
					</Link>
				</p>
			</form>
		</>
	);
}
