import {
	type AnyFormApi,
	createFormHook,
	createFormHookContexts,
	useStore,
} from "@tanstack/react-form";
import { CircleAlertIcon } from "lucide-react";
import { useId } from "react";

import { Alert, AlertDescription } from "#/components/ui/alert.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";

// Kit de formulário: TanStack Form + componentes de campo do shadcn.
// Cada tela usa useAppForm com um schema Zod de src/lib/validators/.

const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

/** Normaliza erros (issues do Zod ou strings vindas do servidor) para o FieldError. */
function mensagens(erros: unknown[]): { message: string }[] {
	return erros
		.map((e) =>
			typeof e === "string"
				? e
				: (e as { message?: string } | undefined)?.message,
		)
		.filter((m): m is string => Boolean(m))
		.map((message) => ({ message }));
}


type PropsCampo = {
	rotulo: string;
	descricao?: string;
	placeholder?: string;
	autoComplete?: string;
};

function useEstadoCampo() {
	const field = useFieldContext<unknown>();
	const tentativas = useStore(field.form.store, (s) => s.submissionAttempts);
	const id = useId();
	// O erro aparece depois que o usuário sai do campo (blur) ou tenta enviar.
	const visivel =
		(field.state.meta.isBlurred || tentativas > 0) && !field.state.meta.isValid;
	const erros = visivel ? mensagens(field.state.meta.errors) : [];
	return { field, id, invalido: erros.length > 0, erros };
}

function CampoTexto({
	rotulo,
	descricao,
	placeholder,
	autoComplete,
	tipo = "text",
}: PropsCampo & { tipo?: "text" | "email" | "password" | "datetime-local" }) {
	const { field: campo, id, invalido, erros } = useEstadoCampo();
	const field = campo as unknown as ReturnType<typeof useFieldContext<string>>;
	const idErro = `${id}-erro`;
	const idDescricao = `${id}-descricao`;

	return (
		<Field data-invalid={invalido}>
			<FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
			<Input
				id={id}
				name={field.name}
				type={tipo}
				value={field.state.value ?? ""}
				placeholder={placeholder}
				autoComplete={autoComplete}
				onBlur={field.handleBlur}
				onChange={(e) => {
					// Limpa o erro vindo do servidor assim que o usuário edita o campo.
					field.setMeta((m) => ({ ...m, errorMap: { ...m.errorMap, onServer: undefined } }));
					field.handleChange(e.target.value);
				}}
				aria-invalid={invalido}
				aria-describedby={
					[descricao ? idDescricao : null, invalido ? idErro : null]
						.filter(Boolean)
						.join(" ") || undefined
				}
			/>
			{descricao && (
				<FieldDescription id={idDescricao}>{descricao}</FieldDescription>
			)}
			<FieldError id={idErro} errors={erros} />
		</Field>
	);
}

function CampoNumero({ rotulo, descricao, placeholder }: PropsCampo) {
	const { field: campo, id, invalido, erros } = useEstadoCampo();
	const field = campo as unknown as ReturnType<typeof useFieldContext<number>>;
	const idErro = `${id}-erro`;
	const idDescricao = `${id}-descricao`;
	const valor = field.state.value;

	return (
		<Field data-invalid={invalido}>
			<FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
			<Input
				id={id}
				name={field.name}
				type="number"
				inputMode="numeric"
				min={1}
				value={Number.isFinite(valor) ? valor : ""}
				placeholder={placeholder}
				onBlur={field.handleBlur}
				onChange={(e) => {
					// Limpa o erro vindo do servidor assim que o usuário edita o campo.
					field.setMeta((m) => ({ ...m, errorMap: { ...m.errorMap, onServer: undefined } }));
					field.handleChange(
						e.target.value === "" ? Number.NaN : Number(e.target.value),
					);
				}}
				aria-invalid={invalido}
				aria-describedby={
					[descricao ? idDescricao : null, invalido ? idErro : null]
						.filter(Boolean)
						.join(" ") || undefined
				}
			/>
			{descricao && (
				<FieldDescription id={idDescricao}>{descricao}</FieldDescription>
			)}
			<FieldError id={idErro} errors={erros} />
		</Field>
	);
}

/** Botão de envio: mostra carregamento e fica desabilitado enquanto envia. */
function BotaoEnviar({
	children,
	enviando = "Enviando…",
}: {
	children: React.ReactNode;
	enviando?: string;
}) {
	const form = useFormContext();
	return (
		<form.Subscribe selector={(s) => s.isSubmitting}>
			{(isSubmitting) => (
				<Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
					{isSubmitting && <Spinner />}
					{isSubmitting ? enviando : children}
				</Button>
			)}
		</form.Subscribe>
	);
}

/** Erros sem campo (ex.: "E-mail ou senha incorretos.") ficam no topo do formulário. */
export function AlertaFormulario({ mensagem }: { mensagem: string | null }) {
	if (!mensagem) return null;
	return (
		<Alert variant="destructive" className="rounded-[5px] border-linha-forte">
			<CircleAlertIcon />
			<AlertDescription className="text-destructive">{mensagem}</AlertDescription>
		</Alert>
	);
}

/** Coloca as mensagens que vieram do servidor ({ campo: mensagem }) nos campos certos. */
export function errosNosCampos(form: AnyFormApi) {
	return (campos: Record<string, string>) => {
		for (const [nome, mensagem] of Object.entries(campos)) {
			if (!form.getFieldInfo(nome)?.instance) continue;
			form.setFieldMeta(nome, (meta) => ({
				...meta,
				errorMap: { ...meta.errorMap, onServer: mensagem },
			}));
		}
	};
}

export const { useAppForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: { CampoTexto, CampoNumero },
	formComponents: { BotaoEnviar },
});
