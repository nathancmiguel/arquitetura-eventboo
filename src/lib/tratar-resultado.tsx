import { useRouter } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";

import { type ErroApp, ERROS, type Resultado } from "./erros/index.ts";

/** Destino do formulário quando o erro é de campo ou de alerta. */
export type AlvoFormulario = {
	/** Recebe { campo: mensagem } para mostrar abaixo de cada campo. */
	campos?: (campos: Record<string, string>) => void;
	/** Mostra o Alert no topo do formulário. */
	alerta?: (mensagem: string) => void;
};

type Opcoes = {
	/** Mensagem do toast de sucesso. */
	sucesso?: string;
	formulario?: AlvoFormulario;
};

/** Toast de erro: mensagem em destaque e o código em letras pequenas. */
export function toastDeErro(erro: ErroApp) {
	toast.error(erro.mensagem, {
		description: (
			<span className="font-mono text-[11px] tracking-wider">
				Código: {erro.codigo}
			</span>
		),
	});
}

/**
 * Único helper do front que reage a um Resultado<T>.
 * A reação é decidida pelo campo `ux` do catálogo de erros:
 *  - campos → mensagens nos campos do formulário
 *  - alerta → Alert no topo do formulário
 *  - toast  → toast (Sonner) com mensagem e código
 *  - login  → vai para /login guardando a página de origem
 * Depois de qualquer ação, recarrega os dados da rota para refletir o servidor.
 */
export function useTratarResultado() {
	const router = useRouter();

	return useCallback(
		async <T,>(
			resultado: Resultado<T>,
			opcoes: Opcoes = {},
		): Promise<T | null> => {
			// Atualiza a tela com o estado real do servidor, mesmo quando a ação falha.
			void router.invalidate();

			if (resultado.ok) {
				if (opcoes.sucesso) toast.success(opcoes.sucesso);
				return resultado.dados;
			}

			const { erro } = resultado;
			const ux = ERROS[erro.codigo].ux;
			const { formulario } = opcoes;

			if (ux === "login") {
				toastDeErro(erro);
				const origem = router.state.location.href;
				await router.navigate({ to: "/login", search: { redirect: origem } });
			} else if (ux === "campos" && erro.campos && formulario?.campos) {
				formulario.campos(erro.campos);
				// Erros sem campo correspondente (chave "_") vão para o alerta.
				if (erro.campos._ && formulario.alerta) formulario.alerta(erro.campos._);
			} else if ((ux === "alerta" || ux === "campos") && formulario?.alerta) {
				formulario.alerta(erro.mensagem);
			} else {
				toastDeErro(erro);
			}
			return null;
		},
		[router],
	);
}
