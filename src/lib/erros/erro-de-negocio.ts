import { type CodigoErro, ERROS } from "./catalogo.ts";

/**
 * Erro lançado pelos serviços quando uma regra de negócio é violada.
 * Não conhece HTTP nem UI: só carrega o código e, se preciso, uma mensagem
 * mais específica (que sobrescreve a padrão) e os campos do formulário afetados.
 */
export class ErroDeNegocio extends Error {
	readonly codigo: CodigoErro;
	readonly campos?: Record<string, string>;

	constructor(
		codigo: CodigoErro,
		opcoes: { mensagem?: string; campos?: Record<string, string> } = {},
	) {
		super(opcoes.mensagem ?? ERROS[codigo].mensagem);
		this.name = "ErroDeNegocio";
		this.codigo = codigo;
		this.campos = opcoes.campos;
	}
}
