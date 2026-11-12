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
import {
	type CriarContaEntrada,
	criarContaSchema,
} from "#/lib/validators/auth.ts";
import { criarConta } from "#/server/auth.ts";

export const Route = createFileRoute("/_auth/criar-conta")({
	// O controle de acesso (já logado não entra) e o layout ficam em _auth/route.tsx.
	head: () => ({ meta: [{ title: "Criar conta — Eventboo" }] }),
	component: CriarConta,
});

function CriarConta() {
	const { redirect: origem } = Route.useSearch();
	const router = useRouter();
	const tratar = useTratarResultado();
	const [alerta, setAlerta] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: { nome: "", email: "", senha: "" } satisfies CriarContaEntrada,
		validators: { onChange: criarContaSchema, onSubmit: criarContaSchema },
		onSubmit: async ({ value }) => {
			setAlerta(null);
			const dados = await tratar(await criarConta({ data: value }), {
				sucesso: "Conta criada. Bem-vindo!",
				formulario: { campos: errosNosCampos(form), alerta: setAlerta },
			});
			// Entra automaticamente após criar a conta (autoSignIn do Better Auth).
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
					<form.AppField name="nome">
						{(f) => (
							<f.CampoTexto
								rotulo="Nome"
								placeholder="Seu nome"
								autoComplete="name"
							/>
						)}
					</form.AppField>
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
								placeholder="Mínimo de 8 caracteres"
								descricao="Use pelo menos 8 caracteres."
								autoComplete="new-password"
							/>
						)}
					</form.AppField>
				</FieldGroup>
				<form.AppForm>
					<form.BotaoEnviar enviando="Criando conta…">Criar conta</form.BotaoEnviar>
				</form.AppForm>
				<p className="text-sm text-muted-foreground">
					Já tem conta?{" "}
					<Link
						to="/login"
						search={{ redirect: origem }}
						className="link font-bold text-ink"
					>
						Entrar
					</Link>
				</p>
			</form>
		</>
	);
}
