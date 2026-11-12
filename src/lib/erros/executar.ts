import { APIError } from "better-auth/api";
import { ZodError } from "zod";

import { type ErroApp, ERROS, type Resultado } from "./catalogo.ts";
import { ErroDeNegocio } from "./erro-de-negocio.ts";
import { mapearErroAuth } from "./mapear-erro-auth.ts";

/** Converte os problemas do Zod em { campo: mensagem } (a primeira de cada campo). */
export function camposDoZod(erro: ZodError): Record<string, string> {
	const campos: Record<string, string> = {};
	for (const issue of erro.issues) {
		const chave = issue.path.join(".") || "_";
		campos[chave] ??= issue.message;
	}
	return campos;
}

/** Transforma qualquer exceção em um ErroApp do catálogo, sem vazar detalhes internos. */
export function paraErroApp(erro: unknown): ErroApp {
	if (erro instanceof ErroDeNegocio) {
		return { codigo: erro.codigo, mensagem: erro.message, campos: erro.campos };
	}
	if (erro instanceof ZodError) {
		return {
			codigo: "DADOS_INVALIDOS",
			mensagem: ERROS.DADOS_INVALIDOS.mensagem,
			campos: camposDoZod(erro),
		};
	}
	if (erro instanceof APIError) {
		const mapeado = mapearErroAuth(erro);
		if (mapeado) return mapeado;
	}
	// Erro inesperado: vai para o log do servidor; o cliente recebe só a mensagem genérica.
	console.error("[ERRO_INTERNO]", erro);
	return { codigo: "ERRO_INTERNO", mensagem: ERROS.ERRO_INTERNO.mensagem };
}

/** Resultado do safeParse do Zod (formato devolvido pelo validator das server functions). */
export type EntradaValidada<E> =
	| { success: true; data: E }
	| { success: false; error: ZodError };

/**
 * Wrapper usado por toda server function.
 * Recebe a entrada já conferida pelo Zod (safeParse) e a ação a executar,
 * e nunca deixa um erro esperado escapar como exceção: devolve sempre Resultado<T>.
 */
export async function executar<E, T>(
	entrada: EntradaValidada<E>,
	acao: (dados: E) => Promise<T> | T,
): Promise<Resultado<T>> {
	if (!entrada.success) {
		return { ok: false, erro: paraErroApp(entrada.error) };
	}
	try {
		return { ok: true, dados: await acao(entrada.data) };
	} catch (erro) {
		return { ok: false, erro: paraErroApp(erro) };
	}
}
