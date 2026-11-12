import { createServerFn } from "@tanstack/react-start";

import { executar } from "#/lib/erros/executar.ts";
import {
	editarEventoSchema,
	eventoIdSchema,
	eventoSchema,
	semEntradaSchema,
} from "#/lib/validators/evento.ts";

import { container } from "./container.ts";
import { usuarioDaSessao, validarCom } from "./sessao.ts";

// Server functions finas: validam com Zod (no servidor), pegam o usuário da
// sessão e chamam o serviço. Nenhuma regra de negócio mora aqui.

export const listarEventos = createServerFn({ method: "GET" })
	.validator(validarCom(semEntradaSchema))
	.handler(async ({ data }) =>
		executar(data, async () =>
			container.eventoService.listarFuturos(await usuarioDaSessao()),
		),
	);

export const buscarEventoParaEdicao = createServerFn({ method: "GET" })
	.validator(validarCom(eventoIdSchema))
	.handler(({ data }) =>
		executar(data, async ({ eventoId }) =>
			container.eventoService.buscarParaEdicao(
				await usuarioDaSessao(),
				eventoId,
			),
		),
	);

export const criarEvento = createServerFn({ method: "POST" })
	.validator(validarCom(eventoSchema))
	.handler(({ data }) =>
		executar(data, async (dados) =>
			container.eventoService.criar(await usuarioDaSessao(), dados),
		),
	);

export const editarEvento = createServerFn({ method: "POST" })
	.validator(validarCom(editarEventoSchema))
	.handler(({ data }) =>
		executar(data, async ({ id, ...dados }) =>
			container.eventoService.atualizar(await usuarioDaSessao(), id, dados),
		),
	);
