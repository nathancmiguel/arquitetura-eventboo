// Datas ficam em UTC no banco e são exibidas em pt-BR no fuso de São Paulo.
export const FUSO = "America/Sao_Paulo";

const formatoData = new Intl.DateTimeFormat("pt-BR", {
	timeZone: FUSO,
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
});
const formatoHora = new Intl.DateTimeFormat("pt-BR", {
	timeZone: FUSO,
	hour: "2-digit",
	minute: "2-digit",
	hourCycle: "h23",
});
const partes = new Intl.DateTimeFormat("en-CA", {
	timeZone: FUSO,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	hourCycle: "h23",
});

/** "10/12/2026" */
export function formatarData(data: Date): string {
	return formatoData.format(data);
}

/** "19h00" */
export function formatarHora(data: Date): string {
	return formatoHora.format(data).replace(":", "h");
}

/** "10/12/2026 · 19h00" */
export function formatarDataHora(data: Date): string {
	return `${formatarData(data)} · ${formatarHora(data)}`;
}

/**
 * Converte o valor de um <input type="datetime-local"> (horário de Brasília) para UTC.
 * O Brasil não tem horário de verão desde 2019, então o deslocamento é fixo (-03:00).
 */
export function dataLocalParaUtc(valor: string): Date {
	return new Date(`${valor}:00-03:00`);
}

/** Converte uma data UTC para o formato do <input type="datetime-local">. */
export function utcParaDataLocal(data: Date): string {
	const p = Object.fromEntries(
		partes.formatToParts(data).map((x) => [x.type, x.value]),
	);
	return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
