import { ErroDeNegocio } from "#/lib/erros/index.ts";
import type { UsuarioSessao } from "#/repositories/contratos.ts";

// Controle de acesso por perfil (RNF3). Fica nos serviços e usa o usuário da
// sessão vindo do servidor: esconder botões na tela não basta.

export function exigirUsuario(usuario: UsuarioSessao | null): UsuarioSessao {
	if (!usuario) throw new ErroDeNegocio("NAO_AUTENTICADO");
	return usuario;
}

export function exigirOrganizador(usuario: UsuarioSessao | null): UsuarioSessao {
	const u = exigirUsuario(usuario);
	if (u.role !== "organizador") throw new ErroDeNegocio("SEM_PERMISSAO");
	return u;
}

export function exigirParticipante(
	usuario: UsuarioSessao | null,
): UsuarioSessao {
	const u = exigirUsuario(usuario);
	if (u.role !== "participante") throw new ErroDeNegocio("SEM_PERMISSAO");
	return u;
}
