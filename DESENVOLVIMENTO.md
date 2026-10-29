# Desenvolvimento — MEI-U / SEMA Apucarana

O desenvolvimento da fase IV será feito no [GitHub da equipe](https://github.com/felipe-rodriguesz/meiu-sema-apu-main). O [GitLab compartilhado pela orientadora](https://gitlab.com/mei-u/sema-ap-residuos-texteis) continua sendo a origem institucional e poderá receber a entrega final.

## Primeira cópia com Git

Para clonar o repositório:

```bash
git clone https://github.com/felipe-rodriguesz/meiu-sema-apu-main.git
cd meiu-sema-apu-main
```

## Ambiente local

São três aplicações independentes, cada uma com seu `package.json` e lockfile. Use Node.js 24 e npm; o banco é PostgreSQL.

1. Execute `npm ci` dentro de `MEIU_API`, `site-frontend` e `mobile-frontend`.
2. Crie um banco PostgreSQL local exclusivo para desenvolvimento e execute nele `MEIU_BANCO/Tabelas.sql`. O schema já inclui a extensão `pgcrypto`.
3. Copie `MEIU_API/.env.example` para `MEIU_API/.env` e configure `DATABASE_URL`, `PORT=3001`, `NODE_ENV=development` e um `JWT_SECRET` local. Os valores do modelo são exemplos.
4. Crie `site-frontend/.env` e `mobile-frontend/.env` com `VITE_API_URL=http://localhost:3001/api/v1`.
5. Cadastre uma conta administrativa fictícia no banco local para testar o login. A coluna `senha_hash` usa bcrypt; não grave a senha em texto puro nem compartilhe credenciais no repositório.

Em três terminais, dentro das respectivas pastas:

| Pasta | Comando | Acesso |
| --- | --- | --- |
| `MEIU_API` | `npm run start:dev` | Swagger: `http://localhost:3001/api/docs` |
| `site-frontend` | `npm run dev -- --port 5173 --strictPort` | `http://localhost:5173` |
| `mobile-frontend` | `npm run dev -- --port 5174 --strictPort` | `http://localhost:5174` |

## Trabalho em equipe

Crie uma branch por tarefa a partir da `main` atualizada:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/nome-da-tarefa
```

Depois de implementar e verificar a alteração:

```bash
git status
git add caminho/dos/arquivos-alterados
git commit -m "feat: descrever a alteração"
git push -u origin HEAD
```

Substitua os exemplos pelos nomes reais. Abra um pull request no GitHub para `main`, descrevendo o que mudou e como testou. O colega revisa; depois do merge, ambos atualizam a `main`. Evitem trabalhar diretamente na `main` e não usem `push --force` nela. Esse é um acordo de trabalho, não uma proteção obrigatória configurada na plataforma.

Para verificar compilação, rode `npm run build` em cada aplicação afetada. O painel usa apenas `vite build`, sem uma checagem separada de TypeScript. Testem também o fluxo que a mudança altera; build aprovado, sozinho, não comprova o funcionamento integrado.

Ao concluir uma atividade, enviem a Benedito e Maria Eduarda: descrição, responsável, data, horas efetivamente dedicadas, evidência e link do commit ou pull request. Horas ainda não registradas ficam a confirmar.

## Arquivos que ficam locais

O `.gitignore` exclui `.env`, dependências, compilações, caches e logs. Os modelos `.env.example` permanecem versionados. Documentos do Drive, e-mails, gravações, transcrições e bases com dados reais não fazem parte desta cópia de código.
