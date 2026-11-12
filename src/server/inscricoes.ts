import { createServerFn } from "@tanstack/react-start";

import { executar } from "#/lib/erros/executar.ts";
import {
	eventoIdSchema,
	inscricaoIdSchema,
	semEntradaSchema,
} from "#/lib/validators/evento.ts";

import { container } from "./container.ts";
import { usuarioDaSessao, validarCom } from "./sessao.ts";

export const inscrever = createServerFn({ method: "POST" })
	.validator(validarCom(eventoIdSchema))
	.handler(({ data }) =>
		executar(data, async ({ eventoId }) =>
			container.inscricaoService.inscrever(await usuarioDaSessao(), eventoId),
		),
	);

export const cancelarInscricao = createServerFn({ method: "POST" })
	.validator(validarCom(inscricaoIdSchema))
	.handler(({ data }) =>
		executar(data, async ({ inscricaoId }) =>
			container.inscricaoService.cancelar(await usuarioDaSessao(), inscricaoId),
		),
	);

export const minhasInscricoes = createServerFn({ method: "GET" })
	.validator(validarCom(semEntradaSchema))
	.handler(({ data }) =>
		executar(data, async () =>
			container.inscricaoService.minhas(await usuarioDaSessao()),
		),
	);
