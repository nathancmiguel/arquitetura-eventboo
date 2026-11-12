// Tipos do domínio e contratos (interfaces) dos repositórios.
//
// Princípio aplicado: Inversão de Dependência (D) — os serviços dependem destas
// interfaces, não do Drizzle. Assim a regra de negócio não sabe qual banco existe
// por baixo, e os testes trocam a implementação por um repositório em memória.

export type Perfil = "participante" | "organizador";

export type UsuarioSessao = {
	id: string;
	nome: string;
	email: string;
	role: Perfil;
};

export type Evento = {
	id: number;
	titulo: string;
	dataHora: Date;
	local: string;
	limiteVagas: number;
};

export type DadosEvento = Omit<Evento, "id">;

export type EventoResumo = Evento & {
	inscritos: number;
	vagasRestantes: number;
	/** Inscrição do usuário atual neste evento (null se não inscrito ou visitante). */
	minhaInscricaoId: number | null;
};

export type Inscricao = {
	id: number;
	eventoId: number;
	usuarioId: string;
	presente: boolean;
};

export type MinhaInscricao = { id: number; evento: Evento };

export type Inscrito = {
	inscricaoId: number;
	nome: string;
	email: string;
	presente: boolean;
};

export type ResultadoInsercao = "inserida" | "lotado" | "duplicada";

export interface EventoRepository {
	listarFuturos(
		aPartirDe: Date,
		usuarioId: string | null,
	): Promise<EventoResumo[]>;
	buscarPorId(id: number): Promise<Evento | null>;
	contarInscritos(eventoId: number): Promise<number>;
	criar(dados: DadosEvento, criadoPor: string): Promise<Evento>;
	atualizar(id: number, dados: DadosEvento): Promise<Evento>;
}

export interface InscricaoRepository {
	buscarPorId(id: number): Promise<Inscricao | null>;
	buscarPorEventoEUsuario(
		eventoId: number,
		usuarioId: string,
	): Promise<Inscricao | null>;
	/**
	 * Confere as vagas e grava a inscrição numa única transação (RNF1).
	 * Não decide nada sobre regras: só garante que a gravação é atômica.
	 */
	inserirSeHouverVaga(
		eventoId: number,
		usuarioId: string,
		limiteVagas: number,
	): Promise<ResultadoInsercao>;
	remover(id: number): Promise<void>;
	listarDoUsuario(usuarioId: string): Promise<MinhaInscricao[]>;
	listarDoEvento(
		eventoId: number,
		pagina: { limite: number; deslocamento: number },
	): Promise<{ itens: Inscrito[]; total: number; presentes: number }>;
	definirPresenca(id: number, presente: boolean): Promise<void>;
}
