import { z } from "zod";

// Um schema por formulário, usado no front (TanStack Form) e no servidor (validator).

const email = z
	.string()
	.trim()
	.min(1, "Informe seu e-mail.")
	.pipe(z.email("Informe um e-mail válido."));

export const loginSchema = z.object({
	email,
	senha: z.string().min(1, "Informe sua senha."),
});

export const criarContaSchema = z.object({
	nome: z
		.string()
		.trim()
		.min(2, "Informe seu nome (pelo menos 2 letras).")
		.max(80, "O nome pode ter no máximo 80 caracteres."),
	email,
	senha: z
		.string()
		.min(8, "A senha precisa ter pelo menos 8 caracteres.")
		.max(128, "A senha pode ter no máximo 128 caracteres."),
});

export type LoginEntrada = z.input<typeof loginSchema>;
export type CriarContaEntrada = z.input<typeof criarContaSchema>;
