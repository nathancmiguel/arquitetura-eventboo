import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { z } from "zod";

import { auth } from "#/lib/auth.ts";
import type { UsuarioSessao } from "#/repositories/contratos.ts";

/** Lê o usuário da sessão a partir do cookie da requisição atual (só no servidor). */
export const usuarioDaSessao = createServerOnlyFn(
	async (): Promise<UsuarioSessao | null> => {
	const sessao = await auth.api.getSession({ headers: getRequestHeaders() });
	if (!sessao) return null;
	return {
		id: sessao.user.id,
		nome: sessao.user.name,
		email: sessao.user.email,
		role: sessao.user.role === "organizador" ? "organizador" : "participante",
	};
	},
);

/**
 * Transforma um schema Zod em validator da server function.
 * Usa safeParse (em vez de parse) para que dados inválidos não virem exceção:
 * o executar() transforma o erro em DADOS_INVALIDOS com os campos.
 */
export function validarCom<S extends z.ZodType>(schema: S) {
	return (entrada: z.input<S>) => schema.safeParse(entrada);
}

/** Usado pela rota raiz para saber quem está logado (null para visitantes). */
export const obterUsuario = createServerFn({ method: "GET" }).handler(() =>
	usuarioDaSessao(),
);
