// Catálogo único: o código decide a mensagem padrão, o status HTTP e como a UI reage.
// O `satisfies` obriga todo código novo a ter mensagem, status e reação definidos,
// e o tipo CodigoErro (derivado daqui) faz o TypeScript acusar códigos inexistentes.
export const ERROS = {
	DADOS_INVALIDOS: {
		mensagem: "Confira os campos destacados.",
		status: 400,
		ux: "campos",
	},
	NAO_AUTENTICADO: {
		mensagem: "Entre na sua conta para continuar.",
		status: 401,
		ux: "login",
	},
	SEM_PERMISSAO: {
		mensagem: "Você não tem permissão para fazer isso.",
		status: 403,
		ux: "toast",
	},
	CREDENCIAIS_INVALIDAS: {
		mensagem: "E-mail ou senha incorretos.",
		status: 401,
		ux: "alerta",
	},
	EMAIL_JA_CADASTRADO: {
		mensagem: "Já existe uma conta com este e-mail.",
		status: 409,
		ux: "campos",
	},
	EVENTO_NAO_ENCONTRADO: {
		mensagem: "Este evento não existe mais.",
		status: 404,
		ux: "toast",
	},
	EVENTO_LOTADO: {
		mensagem: "Este evento já está lotado.",
		status: 409,
		ux: "toast",
	},
	EVENTO_JA_ENCERRADO: {
		mensagem: "Este evento já aconteceu.",
		status: 409,
		ux: "toast",
	},
	INSCRICAO_DUPLICADA: {
		mensagem: "Você já está inscrito neste evento.",
		status: 409,
		ux: "toast",
	},
	INSCRICAO_NAO_ENCONTRADA: {
		mensagem: "Não encontramos essa inscrição.",
		status: 404,
		ux: "toast",
	},
	VAGAS_ABAIXO_DOS_INSCRITOS: {
		mensagem: "O limite não pode ser menor que o número de inscritos.",
		status: 409,
		ux: "campos",
	},
	ERRO_INTERNO: {
		mensagem: "Algo deu errado do nosso lado. Tente novamente.",
		status: 500,
		ux: "toast",
	},
} as const satisfies Record<
	string,
	{
		mensagem: string;
		status: number;
		ux: "campos" | "alerta" | "toast" | "login";
	}
>;

export type CodigoErro = keyof typeof ERROS;

export type ErroApp = {
	codigo: CodigoErro;
	mensagem: string;
	campos?: Record<string, string>;
};

export type Resultado<T> =
	| { ok: true; dados: T }
	| { ok: false; erro: ErroApp };
