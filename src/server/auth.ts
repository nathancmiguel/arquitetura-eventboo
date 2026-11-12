import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "#/lib/auth.ts";
import { executar } from "#/lib/erros/executar.ts";
import { criarContaSchema, loginSchema } from "#/lib/validators/auth.ts";

import { validarCom } from "./sessao.ts";

// Server functions finas: validam com Zod, chamam o Better Auth e devolvem Resultado<T>.
// Os erros do Better Auth são traduzidos por mapearErroAuth (dentro do executar).

export const entrar = createServerFn({ method: "POST" })
	.validator(validarCom(loginSchema))
	.handler(({ data }) =>
		executar(data, async ({ email, senha }) => {
			const { user } = await auth.api.signInEmail({
				body: { email, password: senha },
				headers: getRequestHeaders(),
			});
			return { nome: user.name };
		}),
	);

export const criarConta = createServerFn({ method: "POST" })
	.validator(validarCom(criarContaSchema))
	.handler(({ data }) =>
		executar(data, async ({ nome, email, senha }) => {
			// O perfil não é enviado: o campo role tem input: false e nasce "participante".
			const { user } = await auth.api.signUpEmail({
				body: { name: nome, email, password: senha },
				headers: getRequestHeaders(),
			});
			return { nome: user.name };
		}),
	);

export const sair = createServerFn({ method: "POST" }).handler(async () => {
	await auth.api.signOut({ headers: getRequestHeaders() });
	return { ok: true as const };
});
