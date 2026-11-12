import { ErroDeNegocio } from "#/lib/erros/index.ts";
import type {
	EventoRepository,
	InscricaoRepository,
	MinhaInscricao,
	UsuarioSessao,
} from "#/repositories/contratos.ts";

import { exigirParticipante, exigirUsuario } from "./autorizacao.ts";

// Princípio aplicado: Responsabilidade Única (S) — o InscricaoService só DECIDE
// se a inscrição pode acontecer (evento existe? já passou? lotado? duplicada?).
// A validação do formato da entrada fica no Zod (server function) e a gravação
// atômica fica no repositório. Cada parte muda por um motivo diferente.
//
// Princípio aplicado: Inversão de Dependência (D) — depende das interfaces
// EventoRepository e InscricaoRepository, recebidas pelo construtor. Os testes
// (inscricao-service.test.ts) usam repositórios em memória sem mudar esta classe.
export class InscricaoService {
	constructor(
		private readonly eventos: EventoRepository,
		private readonly inscricoes: InscricaoRepository,
		private readonly agora: () => Date = () => new Date(),
	) {}

	/** RF4: inscreve o participante, recusando evento lotado, passado ou duplicado. */
	async inscrever(
		usuario: UsuarioSessao | null,
		eventoId: number,
	): Promise<{ inscricaoId: number | null; vagasRestantes: number }> {
		const participante = exigirParticipante(usuario);

		const evento = await this.eventos.buscarPorId(eventoId);
		if (!evento) throw new ErroDeNegocio("EVENTO_NAO_ENCONTRADO");
		if (evento.dataHora <= this.agora()) {
			throw new ErroDeNegocio("EVENTO_JA_ENCERRADO");
		}

		// O repositório confere as vagas e grava na mesma transação (RNF1).
		// Aqui só traduzimos o resultado em regra de negócio.
		const resultado = await this.inscricoes.inserirSeHouverVaga(
			evento.id,
			participante.id,
			evento.limiteVagas,
		);
		if (resultado === "lotado") throw new ErroDeNegocio("EVENTO_LOTADO");
		if (resultado === "duplicada") {
			throw new ErroDeNegocio("INSCRICAO_DUPLICADA");
		}

		const inscritos = await this.eventos.contarInscritos(evento.id);
		const inscricao = await this.inscricoes.buscarPorEventoEUsuario(
			evento.id,
			participante.id,
		);
		return {
			inscricaoId: inscricao?.id ?? null,
			vagasRestantes: Math.max(0, evento.limiteVagas - inscritos),
		};
	}

	/** RF5: o participante cancela a PRÓPRIA inscrição; a vaga volta a ficar livre. */
	async cancelar(
		usuario: UsuarioSessao | null,
		inscricaoId: number,
	): Promise<void> {
		const atual = exigirUsuario(usuario);

		const inscricao = await this.inscricoes.buscarPorId(inscricaoId);
		if (!inscricao) throw new ErroDeNegocio("INSCRICAO_NAO_ENCONTRADA");
		if (inscricao.usuarioId !== atual.id) {
			throw new ErroDeNegocio("SEM_PERMISSAO");
		}

		const evento = await this.eventos.buscarPorId(inscricao.eventoId);
		if (evento && evento.dataHora <= this.agora()) {
			throw new ErroDeNegocio("EVENTO_JA_ENCERRADO");
		}

		await this.inscricoes.remover(inscricao.id);
	}

	/** RF5: lista as inscrições do usuário logado. */
	minhas(usuario: UsuarioSessao | null): Promise<MinhaInscricao[]> {
		return this.inscricoes.listarDoUsuario(exigirUsuario(usuario).id);
	}
}
