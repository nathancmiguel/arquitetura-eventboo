import { asc, count, eq, getTableColumns, gt, sql } from "drizzle-orm";

import type { BancoDeDados } from "#/db/index.ts";
import { evento, inscricao } from "#/db/schema.ts";

import type {
	DadosEvento,
	Evento,
	EventoRepository,
	EventoResumo,
} from "./contratos.ts";

const { criadoPor: _criadoPor, criadoEm: _criadoEm, ...colunasEvento } =
	getTableColumns(evento);

// Princípio aplicado: Responsabilidade Única (S) — esta classe só sabe ler e
// gravar eventos no SQLite. Quem pode criar, e com quais limites, é decidido
// no EventoService.
export class DrizzleEventoRepository implements EventoRepository {
	constructor(private readonly db: BancoDeDados) {}

	async listarFuturos(
		aPartirDe: Date,
		usuarioId: string | null,
	): Promise<EventoResumo[]> {
		// Uma única consulta agrega inscritos e a inscrição do usuário (sem N+1).
		// Usa os índices evento_data_hora_idx e inscricao_evento_id_idx (RNF2).
		const linhas = await this.db
			.select({
				...colunasEvento,
				inscritos: count(inscricao.id),
				minhaInscricaoId: usuarioId
					? sql<
							number | null
						>`max(case when ${inscricao.usuarioId} = ${usuarioId} then ${inscricao.id} end)`
					: sql<null>`null`,
			})
			.from(evento)
			.leftJoin(inscricao, eq(inscricao.eventoId, evento.id))
			.where(gt(evento.dataHora, aPartirDe))
			.groupBy(evento.id)
			.orderBy(asc(evento.dataHora));

		return linhas.map((l) => ({
			...l,
			vagasRestantes: Math.max(0, l.limiteVagas - l.inscritos),
			minhaInscricaoId: l.minhaInscricaoId ?? null,
		}));
	}

	async buscarPorId(id: number): Promise<Evento | null> {
		const [linha] = await this.db
			.select(colunasEvento)
			.from(evento)
			.where(eq(evento.id, id))
			.limit(1);
		return linha ?? null;
	}

	async contarInscritos(eventoId: number): Promise<number> {
		const [linha] = await this.db
			.select({ total: count() })
			.from(inscricao)
			.where(eq(inscricao.eventoId, eventoId));
		return linha?.total ?? 0;
	}

	async criar(dados: DadosEvento, criadoPor: string): Promise<Evento> {
		const [linha] = await this.db
			.insert(evento)
			.values({ ...dados, criadoPor })
			.returning(colunasEvento);
		if (!linha) throw new Error("Falha ao inserir evento");
		return linha;
	}

	async atualizar(id: number, dados: DadosEvento): Promise<Evento> {
		const [linha] = await this.db
			.update(evento)
			.set(dados)
			.where(eq(evento.id, id))
			.returning(colunasEvento);
		if (!linha) throw new Error("Falha ao atualizar evento");
		return linha;
	}
}
