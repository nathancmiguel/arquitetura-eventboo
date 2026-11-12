import { sql } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Tabelas do Better Auth (nomes exigidos pela biblioteca)
// ---------------------------------------------------------------------------

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.notNull()
		.default(false),
	image: text("image"),
	// Perfil do usuário. Só o seed cria organizadores (o campo não é aceito na entrada).
	role: text("role", { enum: ["participante", "organizador"] })
		.notNull()
		.default("participante"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

// ---------------------------------------------------------------------------
// Domínio: evento e inscrição
// ---------------------------------------------------------------------------

export const evento = sqliteTable(
	"evento",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		titulo: text("titulo").notNull(),
		// Guardado como timestamp UTC (ms). A exibição converte para America/Sao_Paulo.
		dataHora: integer("data_hora", { mode: "timestamp_ms" }).notNull(),
		local: text("local").notNull(),
		limiteVagas: integer("limite_vagas").notNull(),
		criadoPor: text("criado_por")
			.notNull()
			.references(() => user.id),
		criadoEm: integer("criado_em", { mode: "timestamp_ms" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
	},
	// RNF2: a lista de eventos futuros filtra e ordena por data_hora.
	(t) => [index("evento_data_hora_idx").on(t.dataHora)],
);

export const inscricao = sqliteTable(
	"inscricao",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		eventoId: integer("evento_id")
			.notNull()
			.references(() => evento.id, { onDelete: "cascade" }),
		usuarioId: text("usuario_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		presente: integer("presente", { mode: "boolean" }).notNull().default(false),
		criadaEm: integer("criada_em", { mode: "timestamp_ms" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
	},
	(t) => [
		// RNF1: o banco recusa inscrição duplicada mesmo que a regra falhe.
		uniqueIndex("inscricao_evento_usuario_uq").on(t.eventoId, t.usuarioId),
		// RNF2: contagem e listagem de inscritos por evento.
		index("inscricao_evento_id_idx").on(t.eventoId),
		index("inscricao_usuario_id_idx").on(t.usuarioId),
	],
);
