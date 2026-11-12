// Recria os dados de demonstração do zero (pode rodar quantas vezes quiser).
// Uso: bun run db:seed
import { betterAuth } from "better-auth";
import { eq, inArray } from "drizzle-orm";

import { opcoesAuth } from "#/lib/auth-config.ts";
import { dataLocalParaUtc } from "#/lib/datas.ts";

import { db } from "./index.ts";
import {
	account,
	evento,
	inscricao,
	session,
	user,
	verification,
} from "./schema.ts";

const SENHA = "12345678";

// Instância sem o plugin de cookies (não estamos dentro de uma requisição).
const auth = betterAuth(opcoesAuth);

async function criarUsuario(nome: string, email: string): Promise<string> {
	const { user: criado } = await auth.api.signUpEmail({
		body: { name: nome, email, password: SENHA },
	});
	return criado.id;
}

// 1. Limpa tudo (ordem respeitando as chaves estrangeiras).
await db.delete(inscricao);
await db.delete(evento);
await db.delete(session);
await db.delete(account);
await db.delete(verification);
await db.delete(user);

// 2. Usuários criados pelo próprio Better Auth (senha com hash).
const organizadorId = await criarUsuario("Prof. Carlos", "organizador@evento.com");
const maria = await criarUsuario("Maria Silva", "maria@email.com");
const joao = await criarUsuario("João Pereira", "joao@email.com");
const ana = await criarUsuario("Ana Souza", "ana@email.com");
const bruno = await criarUsuario("Bruno Lima", "bruno@email.com");

// O perfil de organizador só existe pelo seed: ajustado direto no banco.
await db
	.update(user)
	.set({ role: "organizador" })
	.where(eq(user.id, organizadorId));

// Participantes extras só para preencher vagas (não aparecem no README).
const extras: string[] = [];
for (let i = 1; i <= 23; i++) {
	extras.push(
		await criarUsuario(
			`Participante ${String(i).padStart(2, "0")}`,
			`participante${i}@email.com`,
		),
	);
}

// 3. Eventos (todos depois de 09/12/2026, data da apresentação).
const dadosEventos = [
	["Semana de Tecnologia", "2026-12-10T19:00", "Auditório A", 40],
	["Workshop de Git", "2026-12-15T14:00", "Laboratório 3", 30],
	["Palestra: Carreira em TI", "2026-12-18T20:00", "Auditório B", 3],
	["Oficina de UX", "2027-01-12T09:00", "Sala 12", 20],
	["Hackathon de Verão", "2027-01-16T08:00", "Laboratório 1", 25],
	["Mesa-redonda: IA na Educação", "2027-01-21T19:30", "Auditório A", 50],
	["Minicurso de SQL", "2027-01-26T18:00", "Laboratório 2", 15],
	["Encontro de Egressos", "2027-01-30T10:00", "Auditório B", 60],
] as const;

const criados = await db
	.insert(evento)
	.values(
		dadosEventos.map(([titulo, dataHora, local, limiteVagas]) => ({
			titulo,
			dataHora: dataLocalParaUtc(dataHora),
			local,
			limiteVagas,
			criadoPor: organizadorId,
		})),
	)
	.returning({ id: evento.id, titulo: evento.titulo });

const id = (titulo: string) => {
	const e = criados.find((c) => c.titulo === titulo);
	if (!e) throw new Error(`Evento não encontrado no seed: ${titulo}`);
	return e.id;
};

// 4. Inscrições.
const semana = id("Semana de Tecnologia");
await db.insert(inscricao).values([
	// Semana de Tecnologia: Maria, João, Ana e Bruno (dois já presentes).
	{ eventoId: semana, usuarioId: maria, presente: true },
	{ eventoId: semana, usuarioId: joao, presente: true },
	{ eventoId: semana, usuarioId: ana },
	{ eventoId: semana, usuarioId: bruno },
	// Maria também no Workshop de Git.
	{ eventoId: id("Workshop de Git"), usuarioId: maria },
	// Palestra: 3 de 3 (Esgotado).
	{ eventoId: id("Palestra: Carreira em TI"), usuarioId: joao },
	{ eventoId: id("Palestra: Carreira em TI"), usuarioId: ana },
	{ eventoId: id("Palestra: Carreira em TI"), usuarioId: bruno },
	// Hackathon: 23 de 25 (restam 2 vagas).
	...extras.map((usuarioId) => ({
		eventoId: id("Hackathon de Verão"),
		usuarioId,
	})),
]);

const [org] = await db
	.select({ role: user.role })
	.from(user)
	.where(inArray(user.id, [organizadorId]));

console.log(
	`Seed concluído: ${criados.length} eventos, ${5 + extras.length} usuários (organizador: ${org?.role}).`,
);
