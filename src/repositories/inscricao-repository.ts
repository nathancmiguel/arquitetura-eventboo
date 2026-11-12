import { and, asc, count, eq, getTableColumns, sql } from "drizzle-orm";

import type { BancoDeDados } from "#/db/index.ts";
import { evento, inscricao, user } from "#/db/schema.ts";

import type {
	Inscricao,
	InscricaoRepository,
	Inscrito,
	MinhaInscricao,
	ResultadoInsercao,
} from "./contratos.ts";

const { criadaEm: _criadaEm, ...colunasInscricao } = getTableColumns(inscricao);

// Princípio aplicado: Responsabilidade Única (S) — o repositório só grava e lê.
// Ele não sabe se o evento já aconteceu nem quem tem permissão: isso é do serviço.
export class DrizzleInscricaoRepository implements InscricaoRepository {
	constructor(private readonly db: BancoDeDados) {}

	async buscarPorId(id: number): Promise<Inscricao | null> {
		const [linha] = await this.db
			.select(colunasInscricao)
			.from(inscricao)
			.where(eq(inscricao.id, id))
			.limit(1);
		return linha ?? null;
	}

	async buscarPorEventoEUsuario(
		eventoId: number,
		usuarioId: string,
	): Promise<Inscricao | null> {
		const [linha] = await this.db
			.select(colunasInscricao)
			.from(inscricao)
			.where(
				and(eq(inscricao.eventoId, eventoId), eq(inscricao.usuarioId, usuarioId)),
			)
			.limit(1);
		return linha ?? null;
	}

	async inserirSeHouverVaga(
		eventoId: number,
		usuarioId: string,
		limiteVagas: number,
	): Promise<ResultadoInsercao> {
		// RNF1: contagem e inserção na MESMA transação. "immediate" pega o lock de
		// escrita logo no início, então duas inscrições simultâneas não leem a mesma
		// contagem. O índice único (evento_id, usuario_id) barra duplicatas no banco.
		return this.db.transaction(
			(tx) => {
				const ocupadas =
					tx
						.select({ total: count() })
						.from(inscricao)
						.where(eq(inscricao.eventoId, eventoId))
						.get()?.total ?? 0;

				if (ocupadas >= limiteVagas) return "lotado";

				const inserida = tx
					.insert(inscricao)
					.values({ eventoId, usuarioId })
					.onConflictDoNothing()
					.returning({ id: inscricao.id })
					.get();

				return inserida ? "inserida" : "duplicada";
			},
			{ behavior: "immediate" },
		);
	}

	async remover(id: number): Promise<void> {
		await this.db.delete(inscricao).where(eq(inscricao.id, id));
	}

	async listarDoUsuario(usuarioId: string): Promise<MinhaInscricao[]> {
		const linhas = await this.db
			.select({
				id: inscricao.id,
				evento: {
					id: evento.id,
					titulo: evento.titulo,
					dataHora: evento.dataHora,
					local: evento.local,
					limiteVagas: evento.limiteVagas,
				},
			})
			.from(inscricao)
			.innerJoin(evento, eq(evento.id, inscricao.eventoId))
			.where(eq(inscricao.usuarioId, usuarioId))
			.orderBy(asc(evento.dataHora));
		return linhas;
	}

	async listarDoEvento(
		eventoId: number,
		pagina: { limite: number; deslocamento: number },
	): Promise<{ itens: Inscrito[]; total: number; presentes: number }> {
		// RNF2: totais calculados no banco e lista paginada com LIMIT/OFFSET.
		const [totais] = await this.db
			.select({
				total: count(),
				presentes: sql<number>`coalesce(sum(${inscricao.presente}), 0)`,
			})
			.from(inscricao)
			.where(eq(inscricao.eventoId, eventoId));

		const itens = await this.db
			.select({
				inscricaoId: inscricao.id,
				nome: user.name,
				email: user.email,
				presente: inscricao.presente,
			})
			.from(inscricao)
			.innerJoin(user, eq(user.id, inscricao.usuarioId))
			.where(eq(inscricao.eventoId, eventoId))
			.orderBy(asc(user.name), asc(inscricao.id))
			.limit(pagina.limite)
			.offset(pagina.deslocamento);

		return {
			itens,
			total: totais?.total ?? 0,
			presentes: Number(totais?.presentes ?? 0),
		};
	}

	async definirPresenca(id: number, presente: boolean): Promise<void> {
		await this.db
			.update(inscricao)
			.set({ presente })
			.where(eq(inscricao.id, id));
	}
}
