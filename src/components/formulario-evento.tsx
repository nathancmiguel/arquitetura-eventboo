import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "#/components/ui/button.tsx";
import { FieldGroup } from "#/components/ui/field.tsx";
import type { Resultado } from "#/lib/erros/index.ts";
import { useTratarResultado } from "#/lib/tratar-resultado.tsx";
import { type EventoEntrada, eventoSchema } from "#/lib/validators/evento.ts";

import { AlertaFormulario, errosNosCampos, useAppForm } from "./formulario.tsx";

/** Formulário compartilhado por "Novo evento" e "Editar evento". */
export function FormularioEvento({
	valoresIniciais,
	salvar,
	mensagemSucesso,
}: {
	valoresIniciais: EventoEntrada;
	salvar: (valores: EventoEntrada) => Promise<Resultado<unknown>>;
	mensagemSucesso: string;
}) {
	const router = useRouter();
	const tratar = useTratarResultado();
	const [alerta, setAlerta] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: valoresIniciais,
		validators: { onChange: eventoSchema, onSubmit: eventoSchema },
		onSubmit: async ({ value }) => {
			setAlerta(null);
			const resultado = await salvar(value);
			await tratar(resultado, {
				sucesso: mensagemSucesso,
				formulario: { campos: errosNosCampos(form), alerta: setAlerta },
			});
			if (resultado.ok) {
				await router.navigate({ to: "/eventos" });
			}
		},
	});

	return (
		<form
			noValidate
			className="flex max-w-xl flex-col gap-8"
			onSubmit={(e) => {
				e.preventDefault();
				void form.handleSubmit();
			}}
		>
			<AlertaFormulario mensagem={alerta} />
			<FieldGroup className="gap-6">
				<form.AppField name="titulo">
					{(f) => (
						<f.CampoTexto rotulo="Título do evento" placeholder="Ex.: Workshop de Git" />
					)}
				</form.AppField>
				<form.AppField name="dataHora">
					{(f) => (
						<f.CampoTexto
							rotulo="Data e hora"
							tipo="datetime-local"
							descricao="Horário de Brasília."
						/>
					)}
				</form.AppField>
				<form.AppField name="local">
					{(f) => <f.CampoTexto rotulo="Local" placeholder="Ex.: Auditório A" />}
				</form.AppField>
				<form.AppField name="limiteVagas">
					{(f) => (
						<f.CampoNumero
							rotulo="Limite de vagas"
							placeholder="30"
							descricao="Não pode ser menor que o número de inscritos."
						/>
					)}
				</form.AppField>
			</FieldGroup>
			<div className="flex flex-col gap-3 md:flex-row">
				<form.AppForm>
					<form.BotaoEnviar enviando="Salvando…">Salvar evento</form.BotaoEnviar>
				</form.AppForm>
				<Button variant="outline" nativeButton={false} render={<Link to="/eventos" />}>
					Cancelar
				</Button>
			</div>
		</form>
	);
}
