import { notFound, redirect } from "@tanstack/react-router";

import type { CodigoErro, Resultado } from "./erros/index.ts";

/** Erro de carregamento de tela, mostrado pelo errorComponent com o código. */
export class ErroDeCarregamento extends Error {
	constructor(
		mensagem: string,
		readonly codigo: CodigoErro,
	) {
		super(`${mensagem} (Código: ${codigo})`);
		this.name = "ErroDeCarregamento";
	}
}

/**
 * Usado nos loaders: devolve os dados ou converte o erro na reação de navegação
 * (login, página não encontrada ou tela de erro).
 */
export function dadosOuFalha<T>(resultado: Resultado<T>, origem: string): T {
	if (resultado.ok) return resultado.dados;
	const { erro } = resultado;
	if (erro.codigo === "NAO_AUTENTICADO") {
		throw redirect({ to: "/login", search: { redirect: origem } });
	}
	if (erro.codigo === "EVENTO_NAO_ENCONTRADO") throw notFound();
	throw new ErroDeCarregamento(erro.mensagem, erro.codigo);
}

/** Evita redirecionamento aberto: só aceita caminhos internos ("/algo"). */
export function destinoSeguro(redirect: string | undefined): string {
	if (redirect?.startsWith("/") && !redirect.startsWith("//")) return redirect;
	return "/eventos";
}
