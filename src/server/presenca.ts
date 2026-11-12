import { createServerFn } from "@tanstack/react-start";

import { executar } from "#/lib/erros/executar.ts";
import { inscritosSchema, presencaSchema } from "#/lib/validators/evento.ts";

import { container } from "./container.ts";
import { usuarioDaSessao, validarCom } from "./sessao.ts";

export const listarInscritos = createServerFn({ method: "GET" })
	.validator(validarCom(inscritosSchema))
	.handler(({ data }) =>
		executar(data, async ({ eventoId, pagina }) =>
			container.presencaService.listarInscritos(
				await usuarioDaSessao(),
				eventoId,
				pagina,
			),
		),
	);

export const marcarPresenca = createServerFn({ method: "POST" })
	.validator(validarCom(presencaSchema))
	.handler(({ data }) =>
		executar(data, async ({ inscricaoId, presente }) =>
			container.presencaService.marcar(
				await usuarioDaSessao(),
				inscricaoId,
				presente,
			),
		),
	);
