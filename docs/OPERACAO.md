# Execução e manutenção — Fase IV

## Ambiente local com Docker

Requer Docker com Compose. Na raiz do repositório:

1. Copie .env.example para .env.
2. Gere dois segredos diferentes com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Preencha POSTGRES_PASSWORD e JWT_SECRET. Use o valor hexadecimal no password do banco.
4. Execute `docker compose up -d --build`. O serviço migrate aplica as migrações antes de iniciar a API.
5. Abra o formulário em http://localhost:8080/ e o painel em http://localhost:8080/admin/.

O banco usa volume persistente. `docker compose down` preserva o volume; **não use down -v** em um ambiente com dados que precisam ser mantidos. Banco e API não expõem portas diretamente ao host.

Para desenvolvimento sem Docker: Node 24, PostgreSQL 16, `npm ci` em cada aplicação. Copie MEIU_API/.env.example para MEIU_API/.env, configure banco, JWT e CORS; execute `npm run build`, `npm run migration:run` e `npm run start:dev`. Configure VITE_API_URL=http://localhost:3001/api/v1 em cada frontend e execute `npm run dev -- --port 5173` no painel e `npm run dev -- --port 5174` no formulário.

## Criar conta administrativa

Não há senha administrativa padrão nem cadastro público de operadores. Em PowerShell, atribua ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD às variáveis de ambiente da sessão, usando os valores definidos pelo responsável. A senha deve ter pelo menos 12 caracteres e no máximo 72 bytes.

Depois execute:

```powershell
docker compose exec -T -e ADMIN_NAME -e ADMIN_EMAIL -e ADMIN_PASSWORD api npm run admin:create
Remove-Item Env:ADMIN_PASSWORD
```

Na execução sem Docker, rode `npm run admin:create` em MEIU_API. O comando recusa e-mail já cadastrado, sem substituir senha. Guarde credenciais fora do Git e compartilhe somente com operadores autorizados. As contas existentes podem operar todos os pontos; esta fase não inclui permissões por ponto.

## Atualizar um banco existente

1. Faça backup e restaure uma cópia para conferir.
2. Pare a entrada de registros durante a atualização.
3. Compile a nova API.
4. Aplique `npm run migration:run` usando a configuração do banco correto.
5. Reinicie os serviços e verifique login, pedido, recebimento e consulta.

No Compose, reconstrua primeiro (`docker compose build`), pare web/api, execute `docker compose run --rm migrate` e, se concluir com sucesso, `docker compose up -d`.

As migrações reconhecem as tabelas originais, preservam seus dados e registram a execução em meiu_migrations. Pesos/frequências antigos inválidos e registros RECEBIDO sem pesagem auditada interrompem a atualização, com rollback. Corrija essas pendências em cópia de teste antes de atualizar o banco de uso.

Não use synchronize=true. Tabelas.sql é somente uma referência da estrutura: use as migrações para instalar e atualizar, garantindo o registro das versões. Reversões que perderiam dados são recusadas; use backup e a versão correspondente do código.

## Operar o recebimento

1. Entre no painel e abra Pedidos de coleta.
2. Digite o protocolo ou abra o link do pedido fornecido pelo QR Code.
3. Confira o ponto, o material e a pesagem.
4. Informe o peso aferido (ex.: 8,7), marque a conferência e confirme.
5. Verifique RECEBIDO, os pesos separados e o histórico.

O horário e o operador são definidos no servidor. Um segundo envio retorna conflito e não altera a entrega. Em falha de conexão, consulte o pedido antes de tentar novamente.

Para corrigir peso, abra o pedido recebido, escolha Corrigir peso com justificativa, informe o novo valor e o motivo. O peso declarado e a data/operador do recebimento original são preservados. Se outro operador corrigir primeiro, atualize a consulta antes de tentar novamente.

Pontos inativos não aceitam novos pedidos; pedidos já registrados continuam disponíveis para recebimento. Um pedido antigo sem ponto vinculado exige revisão do cadastro, sem confirmação automática. A confirmação representa recebimento, não comprovação da destinação posterior.

## Backup e restauração

Com o Compose em execução, na raiz:

```powershell
./scripts/Backup.ps1
./scripts/Restore-Backup.ps1 -Backup ./.local/backups/ARQUIVO.dump
```

Se usar um arquivo de ambiente diferente, informe -EnvFile nos dois comandos. O backup é binário no formato pg_dump custom; o script o copia sem redirecionar bytes pelo PowerShell. São exibidos tamanho e SHA-256.

A restauração cria um banco novo com prefixo meiu_restore_ e recusa sobrescrever bancos existentes. Compare pedidos, pesos, eventos de histórico e acessos antes de considerar a cópia recuperável. O banco original permanece intacto.

Antes de uso real, o mantenedor deve definir frequência, retenção e armazenamento externo protegido. Faça uma cópia antes de cada atualização e, durante operação, pelo menos ao final de cada dia de atendimento. Arquivos locais não substituem cópia externa. O agendamento depende do servidor escolhido.

## Publicação HTTPS

A configuração está preparada para um servidor Docker com domínio próprio:

1. Defina o mantenedor, a hospedagem e o acesso administrativo ao servidor.
2. Aponte o DNS do domínio para o servidor e libere as portas 80/443.
3. Configure PUBLIC_DOMAIN (somente domínio) e CORS_ORIGINS=https://DOMINIO no .env.
4. Execute `docker compose --profile https up -d --build`.
5. Confira certificado, login, formulário no celular, persistência e backup.

Caddy obtém o certificado para um domínio público válido. Os volumes de certificados precisam ser preservados. HTTPS público não foi provisionado nesta entrega: falta definir servidor/domínio e responsável pela manutenção.

O banco do Compose fica na rede interna. Para PostgreSQL remoto, configure a API/migrador com DATABASE_URL remoto e DATABASE_SSL=true; use DATABASE_CA_FILE quando houver uma CA própria. A validação do certificado permanece habilitada.

## Dados e limites desta entrega

Utilize ambientes e bancos diferentes para demonstração e operação real. Não divulgue uma instalação que contenha pontos fictícios como pontos reais.

Formulário sem localização, configuração operacional dos pontos, QR Code e relatórios/CSV ainda dependem da frente de José. A API e o painel de recebimento estão prontos para integrar essas funcionalidades. Notícias continuam opcionais.

A ativação pública depende também de conferir a infraestrutura escolhida, monitoramento, política de acessos e proteção contra abuso das rotas públicas/login. Os testes controlados desta entrega não são um piloto com a SEMA.

## Testes reproduzíveis

API: crie uma conta PostgreSQL local exclusiva com CREATEDB e um banco com prefixo meiu_faseiv_test. Configure TEST_DATABASE_URL em MEIU_API/.env.test.local e execute `npm test`. A suíte cria bancos temporários, testa a API real e remove apenas esses bancos ao terminar.

Painel: `npm run typecheck`, `npm run build`. Para testes de navegador, suba a instância local, crie um operador fictício, configure E2E_EMAIL e E2E_PASSWORD e execute `npm run test:e2e`. Por padrão usa Edge e http://localhost:8080/admin/. E2E_BROWSER, E2E_BASE_URL e E2E_API_URL permitem ajustar navegador/endereço; os testes aceitam apenas localhost. Em Linux/CI, instale Chromium com `npx playwright install chromium` e use E2E_BROWSER=chromium.

Formulário: `npm run build` em mobile-frontend. Os testes E2E criam pontos/pedidos fictícios, sem limpar automaticamente os dados do ambiente.
