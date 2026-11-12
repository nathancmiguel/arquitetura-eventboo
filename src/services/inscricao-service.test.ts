import { beforeEach, describe, expect, test } from "bun:test";

import { ErroDeNegocio } from "#/lib/erros/index.ts";
import type {
	DadosEvento,
	Evento,
	EventoRepository,
	EventoResumo,
	Inscricao,
	InscricaoRepository,
	Inscrito,
	MinhaInscricao,
	ResultadoInsercao,
	UsuarioSessao,
} from "#/repositories/contratos.ts";

import { InscricaoService } from "./inscricao-service.ts";
import { PresencaService } from "./presenca-service.ts";

// Estes testes comprovam a Inversão de Dependência: os serviços rodam com
// repositórios em memória, sem banco, porque dependem só das interfaces.

class EventoRepositoryEmMemoria implements EventoRepository {
	constructor(
		public eventos: Evento[],
		private readonly inscricoes: InscricaoRepositoryEmMemoria,
	) {}
	async listarFuturos(aPartirDe: Date): Promise<EventoResumo[]> {
		return this.eventos
			.filter((e) => e.dataHora > aPartirDe)
			.map((e) => {
				const inscritos = this.inscricoes.dados.filter(
					(i) => i.eventoId === e.id,
				).length;
				return {
					...e,
					inscritos,
					vagasRestantes: e.limiteVagas - inscritos,
					minhaInscricaoId: null,
				};
			});
	}
	async buscarPorId(id: number) {
		return this.eventos.find((e) => e.id === id) ?? null;
	}
	async contarInscritos(eventoId: number) {
		return this.inscricoes.dados.filter((i) => i.eventoId === eventoId).length;
	}
	async criar(dados: DadosEvento): Promise<Evento> {
		const evento = { ...dados, id: this.eventos.length + 1 };
		this.eventos.push(evento);
		return evento;
	}
	async atualizar(id: number, dados: DadosEvento): Promise<Evento> {
		const evento = { ...dados, id };
		this.eventos = this.eventos.map((e) => (e.id === id ? evento : e));
		return evento;
	}
}

class InscricaoRepositoryEmMemoria implements InscricaoRepository {
	dados: Inscricao[] = [];
	private proximoId = 1;
	async buscarPorId(id: number) {
		return this.dados.find((i) => i.id === id) ?? null;
	}
	async buscarPorEventoEUsuario(eventoId: number, usuarioId: string) {
		return (
			this.dados.find(
				(i) => i.eventoId === eventoId && i.usuarioId === usuarioId,
			) ?? null
		);
	}
	async inserirSeHouverVaga(
		eventoId: number,
		usuarioId: string,
		limiteVagas: number,
	): Promise<ResultadoInsercao> {
		const doEvento = this.dados.filter((i) => i.eventoId === eventoId);
		if (doEvento.length >= limiteVagas) return "lotado";
		if (doEvento.some((i) => i.usuarioId === usuarioId)) return "duplicada";
		this.dados.push({
			id: this.proximoId++,
			eventoId,
			usuarioId,
			presente: false,
		});
		return "inserida";
	}
	async remover(id: number) {
		this.dados = this.dados.filter((i) => i.id !== id);
	}
	async listarDoUsuario(): Promise<MinhaInscricao[]> {
		return [];
	}
	async listarDoEvento(): Promise<{
		itens: Inscrito[];
		total: number;
		presentes: number;
	}> {
		return { itens: [], total: 0, presentes: 0 };
	}
	async definirPresenca(id: number, presente: boolean) {
		const inscricao = this.dados.find((i) => i.id === id);
		if (inscricao) inscricao.presente = presente;
	}
}

const AGORA = new Date("2026-12-09T12:00:00Z");
const FUTURO = new Date("2026-12-15T17:00:00Z");

const maria: UsuarioSessao = {
	id: "u-maria",
	nome: "Maria",
	email: "maria@email.com",
	role: "participante",
};
const joao: UsuarioSessao = { ...maria, id: "u-joao", nome: "João" };
const organizador: UsuarioSessao = {
	id: "u-org",
	nome: "Prof. Carlos",
	email: "organizador@evento.com",
	role: "organizador",
};

/** Executa a ação e devolve o código do ErroDeNegocio lançado. */
async function codigoDoErro(acao: () => Promise<unknown>) {
	try {
		await acao();
	} catch (erro) {
		if (erro instanceof ErroDeNegocio) return erro.codigo;
		throw erro;
	}
	throw new Error("Esperava um ErroDeNegocio, mas a ação funcionou.");
}

let inscricoes: InscricaoRepositoryEmMemoria;
let eventos: EventoRepositoryEmMemoria;
let service: InscricaoService;

beforeEach(() => {
	inscricoes = new InscricaoRepositoryEmMemoria();
	eventos = new EventoRepositoryEmMemoria(
		[
			{ id: 1, titulo: "Workshop de Git", dataHora: FUTURO, local: "Lab 3", limiteVagas: 30 },
			{ id: 2, titulo: "Palestra", dataHora: FUTURO, local: "Aud. B", limiteVagas: 1 },
			{ id: 3, titulo: "Evento passado", dataHora: new Date("2026-01-01"), local: "X", limiteVagas: 10 },
		],
		inscricoes,
	);
	service = new InscricaoService(eventos, inscricoes, () => AGORA);
});

describe("InscricaoService", () => {
	test("inscreve quando há vaga", async () => {
		const resultado = await service.inscrever(maria, 1);
		expect(resultado.vagasRestantes).toBe(29);
		expect(resultado.inscricaoId).not.toBeNull();
		expect(inscricoes.dados).toHaveLength(1);
	});

	test("recusa evento lotado com EVENTO_LOTADO", async () => {
		await service.inscrever(maria, 2);
		expect(await codigoDoErro(() => service.inscrever(joao, 2))).toBe(
			"EVENTO_LOTADO",
		);
		expect(inscricoes.dados).toHaveLength(1);
	});

	test("recusa inscrição duplicada com INSCRICAO_DUPLICADA", async () => {
		await service.inscrever(maria, 1);
		expect(await codigoDoErro(() => service.inscrever(maria, 1))).toBe(
			"INSCRICAO_DUPLICADA",
		);
	});

	test("recusa evento que já aconteceu com EVENTO_JA_ENCERRADO", async () => {
		expect(await codigoDoErro(() => service.inscrever(maria, 3))).toBe(
			"EVENTO_JA_ENCERRADO",
		);
	});

	test("visitante sem sessão recebe NAO_AUTENTICADO", async () => {
		expect(await codigoDoErro(() => service.inscrever(null, 1))).toBe(
			"NAO_AUTENTICADO",
		);
	});

	test("cancelamento libera a vaga", async () => {
		await service.inscrever(maria, 2);
		const [inscricao] = inscricoes.dados;
		await service.cancelar(maria, inscricao!.id);
		expect(inscricoes.dados).toHaveLength(0);
		// A vaga voltou: outro participante consegue se inscrever.
		await service.inscrever(joao, 2);
		expect(inscricoes.dados).toHaveLength(1);
	});

	test("participante não cancela inscrição de outro (SEM_PERMISSAO)", async () => {
		await service.inscrever(maria, 1);
		const [inscricao] = inscricoes.dados;
		expect(await codigoDoErro(() => service.cancelar(joao, inscricao!.id))).toBe(
			"SEM_PERMISSAO",
		);
	});

	test("cancelar inscrição inexistente dá INSCRICAO_NAO_ENCONTRADA", async () => {
		expect(await codigoDoErro(() => service.cancelar(maria, 999))).toBe(
			"INSCRICAO_NAO_ENCONTRADA",
		);
	});
});

describe("PresencaService", () => {
	test("participante tentando marcar presença recebe SEM_PERMISSAO", async () => {
		const presenca = new PresencaService(eventos, inscricoes);
		await service.inscrever(joao, 1);
		const [inscricao] = inscricoes.dados;
		expect(
			await codigoDoErro(() => presenca.marcar(maria, inscricao!.id, true)),
		).toBe("SEM_PERMISSAO");
		expect(inscricao!.presente).toBe(false);
	});

	test("organizador marca e desmarca presença", async () => {
		const presenca = new PresencaService(eventos, inscricoes);
		await service.inscrever(joao, 1);
		const [inscricao] = inscricoes.dados;
		await presenca.marcar(organizador, inscricao!.id, true);
		expect(inscricao!.presente).toBe(true);
		await presenca.marcar(organizador, inscricao!.id, false);
		expect(inscricao!.presente).toBe(false);
	});
});
