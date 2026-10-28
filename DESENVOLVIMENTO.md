# Desenvolvimento — MEI-U / SEMA Apucarana

O desenvolvimento da fase IV será feito no [GitHub da equipe](https://github.com/felipe-rodriguesz/meiu-sema-apu-main). O [GitLab compartilhado pela orientadora](https://gitlab.com/mei-u/sema-ap-residuos-texteis) continua sendo a origem institucional e poderá receber a entrega final.

## Primeira cópia com Git

Depois de aceitar o convite de acesso, clone o repositório. Baixar um ZIP não configura o versionamento.

```bash
git clone https://github.com/felipe-rodriguesz/meiu-sema-apu-main.git
cd meiu-sema-apu-main
```

Também é possível clonar pelo GitHub Desktop. A pasta de desenvolvimento preparada no computador do Felipe chama-se `sema-ap-residuos-texteis`; a pasta antiga baixada como ZIP foi preservada.

## Ambiente local

São três aplicações independentes, cada uma com seu `package.json` e lockfile. Use Node.js 24 e npm; o banco é PostgreSQL. A migração não instalou dependências nem criou um novo banco. O ambiente de demonstração anterior continua separado.

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

Se essas portas estiverem ocupadas pela demonstração anterior, encerre os processos correspondentes antes de iniciar a nova cópia. O README herdado da API menciona Compose e `001_initial_schema.sql`, mas esses arquivos não vieram no material recebido; use o schema existente acima.

## Trabalho em dupla

Antes de começar, combinem pelo WhatsApp a tarefa, o responsável e os arquivos que provavelmente serão alterados. Criem uma branch por tarefa a partir da `main` atualizada:

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

## Entrega futura ao GitLab

No computador do Felipe, `origin` aponta para o GitHub e `gitlab` para o repositório da orientadora. O destino padrão dos pushes é o GitHub. Em outra clonagem, o segundo remoto pode ser adicionado quando necessário:

```bash
git remote add gitlab https://gitlab.com/mei-u/sema-ap-residuos-texteis.git
```

Quando a fase estiver pronta, execute `git fetch gitlab`, compare as mudanças recebidas da equipe e resolva eventuais divergências antes da entrega. Envie uma branch específica ao GitLab e abra um merge request para revisão. Exemplo, somente nessa etapa:

```bash
git switch -c entrega/fase-iv main
git push gitlab HEAD:entrega/fase-iv
```

A permissão de Developer não garante escrita direta na branch protegida. Não é necessário usar `push --mirror` nem sobrescrever o histórico do GitLab.

## Registro da migração — 28/10/2026

- O GitLab tinha duas branches e dois commits, sem tags.
- A `main` original apontava para `9f8facce81139cc357cf5128990fa3fc1e2aec77`, com o README inicial.
- A branch `thomasfortuna-main-patch-24646` apontava para `8b1ae915f7bd90144ea07daf772ff90b344a8bca`, contendo o arquivo `meiu-sema-apu-main.zip`.
- Esses dois commits foram preservados, com seus autores e hashes. A `main` do GitHub continua esse histórico e acrescenta a extração dos fontes e a documentação de desenvolvimento. A branch original do ZIP permanece disponível.
- Os 100 arquivos do ZIP eram idênticos, byte a byte, aos da pasta baixada anteriormente. Foram extraídos 98 arquivos; dois arquivos gerados em `site-frontend/.vite/deps` ficaram fora da árvore de trabalho. O ZIP original continua acessível no histórico.
- O código da aplicação e os lockfiles foram mantidos. Foram adicionados o `.gitignore` da raiz, este guia e o aviso no README. Não foram implementadas funcionalidades da fase IV durante a migração.
- Não havia submódulos nem referências Git LFS no material recebido. Issues, configurações do serviço, banco e hospedagem não foram migrados. Nenhuma alteração foi enviada ao GitLab.
- SHA-256 do ZIP de origem: `f3109016dfb61f5507fa47c107ace09c7bb1337a3f274657ee400fa2ed1ce9b5`.
