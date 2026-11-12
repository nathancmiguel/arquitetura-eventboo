import type { APIError } from "better-auth/api";

import { type ErroApp, ERROS } from "./catalogo.ts";

const SENHA_CURTA = "A senha precisa ter pelo menos 8 caracteres.";

/**
 * Traduz os erros do Better Auth para o mesmo formato do restante da aplicação,
 * para a UI tratar login e cadastro como qualquer outra ação.
 */
export function mapearErroAuth(erro: APIError): ErroApp | null {
	const codigo = String(
		(erro.body as { code?: string } | undefined)?.code ?? "",
	);

	if (codigo.startsWith("USER_ALREADY_EXISTS")) {
		return {
			codigo: "EMAIL_JA_CADASTRADO",
			mensagem: ERROS.EMAIL_JA_CADASTRADO.mensagem,
			campos: { email: ERROS.EMAIL_JA_CADASTRADO.mensagem },
		};
	}

	// No login a mensagem é sempre a mesma: não revelamos se o e-mail existe.
	if (
		[
			"INVALID_EMAIL_OR_PASSWORD",
			"INVALID_EMAIL",
			"INVALID_PASSWORD",
			"CREDENTIAL_ACCOUNT_NOT_FOUND",
			"USER_NOT_FOUND",
		].includes(codigo)
	) {
		return {
			codigo: "CREDENCIAIS_INVALIDAS",
			mensagem: ERROS.CREDENCIAIS_INVALIDAS.mensagem,
		};
	}

	if (codigo === "PASSWORD_TOO_SHORT" || codigo === "PASSWORD_TOO_LONG") {
		return {
			codigo: "DADOS_INVALIDOS",
			mensagem: ERROS.DADOS_INVALIDOS.mensagem,
			campos: { senha: SENHA_CURTA },
		};
	}

	return null;
}
