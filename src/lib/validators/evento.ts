import { z } from "zod";

import { dataLocalParaUtc } from "../datas.ts";

// Um schema por formulário, usado no front (TanStack Form) e no servidor (validator).

const MSG_VAGAS = "O limite de vagas precisa ser um número maior que zero.";

export const eventoSchema = z.object({
	titulo: z
		.string()
		.trim()
		.min(3, "O título precisa ter pelo menos 3 caracteres.")
		.max(120, "O título pode ter no máximo 120 caracteres."),
	// Valor de <input type="datetime-local">: "aaaa-mm-ddThh:mm", no horário de Brasília.
	dataHora: z
		.string()
		.min(1, "Informe a data e a hora do evento.")
		.regex(
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
			"Informe uma data e hora válidas.",
		)
		.refine(
			(valor) => dataLocalParaUtc(valor).getTime() > Date.now(),
			"A data do evento precisa estar no futuro.",
		)
		// No servidor a saída já é a data em UTC, pronta para o serviço.
		.transform(dataLocalParaUtc),
	local: z
		.string()
		.trim()
		.min(2, "Informe o local do evento.")
		.max(120, "O local pode ter no máximo 120 caracteres."),
	limiteVagas: z
		.number({ error: MSG_VAGAS })
		.int("O limite de vagas precisa ser um número inteiro.")
		.positive(MSG_VAGAS)
		.max(10_000, "O limite de vagas pode ser no máximo 10.000."),
});

export const editarEventoSchema = eventoSchema.extend({
	id: z.number().int().positive(),
});

// Entradas das demais server functions (também validadas no servidor).
export const eventoIdSchema = z.object({ eventoId: z.number().int().positive() });
export const inscricaoIdSchema = z.object({
	inscricaoId: z.number().int().positive(),
});
export const inscritosSchema = z.object({
	eventoId: z.number().int().positive(),
	pagina: z.number().int().min(1).default(1),
});
export const presencaSchema = z.object({
	inscricaoId: z.number().int().positive(),
	presente: z.boolean(),
});
export const semEntradaSchema = z.undefined();

export type EventoEntrada = z.input<typeof eventoSchema>;
