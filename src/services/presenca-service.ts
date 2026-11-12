import { ErroDeNegocio } from "#/lib/erros/index.ts";
import type {
	Evento,
	EventoRepository,
	InscricaoRepository,
	Inscrito,
	UsuarioSessao,
} from "#/repositories/contratos.ts";

import { exigirOrganizador } from "./autorizacao.ts";

export const INSCRITOS_POR_PAGINA = 8;

export type PaginaDeInscritos = {
	evento: Evento;
	inscritos: Inscrito[];
	total: number;
	presentes: number;
	pagina: number;
	porPagina: number;
	totalPaginas: number;
};

// Princípio aplicado: Responsabilidade Única (S) — a presença tem regras próprias
// (só o organizador vê inscritos e marca presença), separadas da inscrição.
export class PresencaService {
	constructor(
		private readonly eventos: EventoRepository,
		private readonly inscricoes: InscricaoRepository,
	) {}

	/** RF6: inscritos do evento, paginados no servidor, com totais. */
	async listarInscritos(
		usuario: UsuarioSessao | null,
		eventoId: number,
		pagina: number,
	): Promise<PaginaDeInscritos> {
		exigirOrganizador(usuario);
		const evento = await this.eventos.buscarPorId(eventoId);
		if (!evento) throw new ErroDeNegocio("EVENTO_NAO_ENCONTRADO");

		const { itens, total, presentes } = await this.inscricoes.listarDoEvento(
			eventoId,
			{
				limite: INSCRITOS_POR_PAGINA,
				deslocamento: (pagina - 1) * INSCRITOS_POR_PAGINA,
			},
		);
		return {
			evento,
			inscritos: itens,
			total,
			presentes,
			pagina,
			porPagina: INSCRITOS_POR_PAGINA,
			totalPaginas: Math.max(1, Math.ceil(total / INSCRITOS_POR_PAGINA)),
		};
	}

	/** RF7: marca ou desmarca a presença de um inscrito. */
	async marcar(
		usuario: UsuarioSessao | null,
		inscricaoId: number,
		presente: boolean,
	): Promise<{ presente: boolean }> {
		exigirOrganizador(usuario);
		const inscricao = await this.inscricoes.buscarPorId(inscricaoId);
		if (!inscricao) throw new ErroDeNegocio("INSCRICAO_NAO_ENCONTRADA");

		await this.inscricoes.definirPresenca(inscricaoId, presente);
		return { presente };
	}
}
