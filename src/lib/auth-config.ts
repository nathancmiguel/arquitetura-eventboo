import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "#/db/index.ts";
import * as schema from "#/db/schema.ts";

/**
 * Opções do Better Auth compartilhadas entre a aplicação e o seed.
 * O seed roda fora de uma requisição HTTP, então não usa o plugin de cookies.
 */
export const opcoesAuth = {
	database: drizzleAdapter(db, { provider: "sqlite", schema }),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8, // a senha é guardada com hash pelo Better Auth (RNF3)
		requireEmailVerification: false,
		autoSignIn: true, // entra automaticamente após criar a conta
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: false,
				defaultValue: "participante",
				// RNF3: o campo não é aceito na entrada, então ninguém
				// consegue se cadastrar como organizador pela API.
				input: false,
			},
		},
	},
} satisfies BetterAuthOptions;
