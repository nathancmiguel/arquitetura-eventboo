# Eventboo

Participantes se inscrevem em eventos com vagas limitadas e o organizador acompanha os inscritos e marca a presença de cada um. Trabalho da disciplina Arquitetura e Projeto de Software: monólito em camadas com TanStack Start, Bun, SQLite (Drizzle) e Better Auth.

## Instalação

Requisito: [Bun](https://bun.sh) 1.4 ou superior.

```bash
bun install
cp .env.example .env    # depois troque o BETTER_AUTH_SECRET
```

## Como rodar

```bash
bun run db:migrate   # cria as tabelas no arquivo SQLite
bun run db:seed      # recria os dados de demonstração (pode repetir)
bun run dev          # http://localhost:3000
```

Outros scripts: `bun run build` seguido de `bun run preview`, `bun test`, `bun run typecheck` e `bun run db:generate` (gera uma nova migração depois de mudar o schema).

## Contas de demonstração

Todas usam a senha `12345678`.

| Perfil | Nome | E-mail |
| --- | --- | --- |
| Organizador | Prof. Carlos | organizador@evento.com |
| Participante | Maria Silva | maria@email.com |
| Participante | João Pereira | joao@email.com |
| Participante | Ana Souza | ana@email.com |
| Participante | Bruno Lima | bruno@email.com |

## Exemplo rápido de uso

1. Entre como **maria@email.com**. Em "Próximos eventos", inscreva-se no "Hackathon de Verão": o contador cai de 2 para 1 vaga.
2. Em "Minhas inscrições", cancele a inscrição. A vaga volta para o evento.
3. Saia e entre como **organizador@evento.com**. Em "Semana de Tecnologia", clique em "Ver inscritos" e marque ou desmarque presenças; o total de presentes é atualizado.
4. Em "Editar", tente reduzir o limite de vagas do Hackathon para 10. O sistema recusa, porque já existem 23 inscritos.

## Arquitetura

```
src/
  routes/        telas (só UI e chamadas às server functions)
  components/    componentes de UI (shadcn personalizado + layout e formulários)
  server/        server functions finas (Zod + sessão + serviço) e container.ts (injeção de dependência)
  services/      regras de negócio: EventoService, InscricaoService, PresencaService
  repositories/  contratos (interfaces) e implementações com Drizzle
  db/            schema, cliente bun:sqlite, migração e seed
  lib/           auth, validators (Zod), erros, datas
```

## Códigos de erro

Toda ação devolve `Resultado<T>`, que é `{ ok: true, dados }` ou `{ ok: false, erro: { codigo, mensagem, campos? } }`. O catálogo fica em `src/lib/erros/catalogo.ts`.

| Código | Significado | Como aparece |
| --- | --- | --- |
| `DADOS_INVALIDOS` | A entrada não passou na validação do Zod | Mensagem abaixo de cada campo |
| `NAO_AUTENTICADO` | É preciso estar logado | Vai para o login e depois volta |
| `SEM_PERMISSAO` | O perfil do usuário não permite a ação | Toast |
| `CREDENCIAIS_INVALIDAS` | E-mail ou senha incorretos | Alerta no formulário |
| `EMAIL_JA_CADASTRADO` | Já existe conta com o e-mail | Mensagem no campo e-mail |
| `EVENTO_NAO_ENCONTRADO` | O evento não existe | Toast ou página 404 |
| `EVENTO_LOTADO` | Não há mais vagas | Toast |
| `EVENTO_JA_ENCERRADO` | O evento já aconteceu | Toast |
| `INSCRICAO_DUPLICADA` | O usuário já está inscrito | Toast |
| `INSCRICAO_NAO_ENCONTRADA` | A inscrição não existe | Toast |
| `VAGAS_ABAIXO_DOS_INSCRITOS` | Limite menor que o número de inscritos | Mensagem no campo limite |
| `ERRO_INTERNO` | Erro inesperado (detalhes só no log do servidor) | Toast |
