import { ErroDeNegocio } from "#/lib/erros/index.ts";
import type {
	DadosEvento,
	Evento,
	EventoRepository,
	EventoResumo,
	UsuarioSessao,
} from "#/repositories/contratos.ts";

import { exigirOrganizador } from "./autorizacao.ts";

// Princípio aplicado: Inversão de Dependência (D) — o serviço recebe um
// EventoRepository (interface) pelo construtor. Ele não importa o Drizzle, então
// a regra "o limite não pode ficar abaixo dos inscritos" vale para qualquer banco.
export class EventoService {
	constructor(
		private readonly eventos: EventoRepository,
		private readonly agora: () => Date = () => new Date(),
	) {}

	/** RF2: qualquer visitante vê os eventos futuros. */
	listarFuturos(usuario: UsuarioSessao | null): Promise<EventoResumo[]> {
		return this.eventos.listarFuturos(this.agora(), usuario?.id ?? null);
	}

	/** RF3: dados de um evento para o formulário de edição. */
	async buscarParaEdicao(
		usuario: UsuarioSessao | null,
		id: number,
	): Promise<Evento & { inscritos: number }> {
		exigirOrganizador(usuario);
		const evento = await this.buscarOuFalhar(id);
		return { ...evento, inscritos: await this.eventos.contarInscritos(id) };
	}

	/** RF3: o organizador cria eventos. */
	async criar(usuario: UsuarioSessao | null, dados: DadosEvento): Promise<Evento> {
		const organizador = exigirOrganizador(usuario);
		return this.eventos.criar(dados, organizador.id);
	}

	/** RF3: edita, sem deixar o limite abaixo do número de inscritos. */
	async atualizar(
		usuario: UsuarioSessao | null,
		id: number,
		dados: DadosEvento,
	): Promise<Evento> {
		exigirOrganizador(usuario);
		await this.buscarOuFalhar(id);

		const inscritos = await this.eventos.contarInscritos(id);
		if (dados.limiteVagas < inscritos) {
			const mensagem = `O limite não pode ser menor que o número de inscritos (${inscritos}).`;
			throw new ErroDeNegocio("VAGAS_ABAIXO_DOS_INSCRITOS", {
				mensagem,
				campos: { limiteVagas: mensagem },
			});
		}
		return this.eventos.atualizar(id, dados);
	}

	private async buscarOuFalhar(id: number): Promise<Evento> {
		const evento = await this.eventos.buscarPorId(id);
		if (!evento) throw new ErroDeNegocio("EVENTO_NAO_ENCONTRADO");
		return evento;
	}
}
