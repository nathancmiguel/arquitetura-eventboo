import { db } from "#/db/index.ts";
import { DrizzleEventoRepository } from "#/repositories/evento-repository.ts";
import { DrizzleInscricaoRepository } from "#/repositories/inscricao-repository.ts";
import { EventoService } from "#/services/evento-service.ts";
import { InscricaoService } from "#/services/inscricao-service.ts";
import { PresencaService } from "#/services/presenca-service.ts";

// Composição (injeção de dependência): o ÚNICO lugar que sabe quais
// implementações concretas são usadas. Trocar o Drizzle por outro banco
// mexe só aqui; os serviços continuam iguais.
const eventoRepository = new DrizzleEventoRepository(db);
const inscricaoRepository = new DrizzleInscricaoRepository(db);

export const container = {
	eventoService: new EventoService(eventoRepository),
	inscricaoService: new InscricaoService(eventoRepository, inscricaoRepository),
	presencaService: new PresencaService(eventoRepository, inscricaoRepository),
};
