# Execução e manutenção — Fase IV

## Ambiente local com Docker

Requer Docker com Compose. Na raiz do repositório:

1. Copie .env.example para .env.
2. Gere dois segredos diferentes com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Preencha POSTGRES_PASSWORD e JWT_SECRET. Use o valor hexadecimal no password do banco.
4. Execute `docker compose up -d --build`. O serviço migrate aplica as migrações antes de iniciar a API.
5. Abra o formulário em http://localhost:8080/ e o painel em http://localhost:8080/admin/.

O banco usa volume persistente. `docker compose down` preserva o volume; **não use down -v** em um ambiente com dados que precisam ser mantidos. Banco e API não expõem portas diretamente ao host.

Para desenvolvimento sem Docker: Node 24, PostgreSQL 16, `npm ci` em cada aplicação. Copie MEIU_API/.env.example para MEIU_API/.env, configure banco, JWT e CORS; execute `npm run build`, `npm run migration:run` e `npm run start:dev`. Configure VITE_API_URL=http://localhost:3001/api/v1 em cada frontend e execute `npm run dev -- --port 5173` no painel e `npm run dev -- --port 5174` no formulário. No formulário, configure também VITE_PAINEL_URL=http://localhost:5173/ para o QR Code. Em produção com interfaces separadas, use o endereço HTTPS real do painel e reconstrua o formulário; a URL é definida na compilação.

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

Antes da divulgação, abra **Pontos de coleta** e cadastre o local no mapa. Confira nome, modalidade, endereço e bairro à direita (o preenchimento manual continua disponível). A seção **Condições de atendimento** fica abaixo, ocupando toda a largura. Use **Editar ponto** para atualizar e **Desativar Ponto** ao encerrar.

Informe o início e o fim no **Horário padrão** e selecione os dias que o utilizam. Para uma exceção, clique em **Personalizar** ao lado do dia. **Usar padrão** restaura o intervalo comum. Alterar o padrão atualiza os dias selecionados, preservando as exceções. Ao reabrir o cadastro, o intervalo mais frequente é exibido como padrão. A duração é calculada automaticamente; o fim precisa ser posterior ao início, no mesmo dia. Ao desmarcar um dia, seu horário é removido do formulário. As datas de início/fim do período de atendimento não são mais utilizadas na interface.

Marque os tipos de resíduos aceitos na lista. Para um material não listado, selecione **Outro**, digite o nome e clique em **Adicionar** (ou Enter). É possível adicionar mais de um, remover individualmente pelo × e desmarcar Outro para retirar as opções personalizadas. Esses materiais pertencem somente ao ponto editado; não mudam a lista dos demais pontos.

Dias e horários orientam a entrega presencial; não são agenda ou autorização prévia. É possível registrar antecipadamente enquanto o ponto estiver ativo. Desative-o quando não puder receber. O limite é por pedido, aplicado ao peso declarado; não é limite por pessoa ou controle de estoque/capacidade diária. Materiais aceitos são instruções para conferência presencial, sem classificação automática por texto.

No formulário, localização negada/ausente não impede o registro. A localização do aparelho apenas ordena os pontos por proximidade; não é enviada como origem do resíduo. Pontos sem coordenadas continuam selecionáveis pela lista. O protocolo e o QR são apresentados mesmo se o navegador bloquear armazenamento local. Baixe o QR ou guarde o número antes de sair da tela. O QR contém somente o link do painel/protocolo; a consulta exige login.

1. Entre no painel e abra Pedidos de coleta.
2. Digite o protocolo ou abra o link do pedido fornecido pelo QR Code.
3. Confira o ponto, o material e a pesagem.
4. Informe o peso aferido (ex.: 8,7), marque a conferência e confirme.
5. Verifique RECEBIDO, os pesos separados e o histórico.

O horário e o operador são definidos no servidor. Um segundo envio retorna conflito e não altera a entrega. Em falha de conexão, consulte o pedido antes de tentar novamente.

Para corrigir peso, abra o pedido recebido, escolha Corrigir peso com justificativa, informe o novo valor, diferente do peso atual, e o motivo. O peso declarado e a data/operador do recebimento original são preservados. Se outro operador corrigir primeiro, atualize a consulta antes de tentar novamente.

Pontos inativos não aceitam novos pedidos; pedidos já registrados continuam disponíveis para recebimento. Um pedido antigo sem ponto vinculado exige revisão do cadastro, sem confirmação automática. A confirmação representa recebimento, não comprovação da destinação posterior.

## Consultar relatórios e exportar

Abra **Relatórios**, escolha o período por data de registro ou de recebimento e aplique os filtros de ponto, tipo de resíduo e situação. Os cartões e agrupamentos mostram registros, pendências, recebimentos e pesos declarados/recebidos separados. Registros não equivalem a geradores únicos. Correções atualizam o peso recebido sem contar um novo atendimento.

Os filtros aplicados aparecem acima dos totais. Ao alterar algum campo, aplique os filtros antes de exportar; o aviso e o botão desabilitado evitam baixar resultados desatualizados em relação à seleção.

**Exportar CSV dos filtros aplicados** usa a mesma consulta e inclui todos os registros filtrados, mesmo quando a tabela mostra inicialmente apenas 100. O arquivo usa UTF-8 com BOM, ponto e vírgula, vírgula decimal e três casas nos pesos. Valores de texto que poderiam virar fórmulas em planilhas recebem um apóstrofo de proteção. Sem resultados, o arquivo contém somente o cabeçalho.

O intervalo inclui os dois dias. Os filtros de data, a lista de pedidos, o relatório e o CSV usam America/Sao_Paulo. A migração interpreta os registros sem fuso como UTC, a convenção usada no ambiente publicado. Se importar dados de outra origem, confira a convenção antes de migrar. Filtrar por recebimento exclui registros ainda não recebidos. CSV e tela consultam o banco no momento de cada solicitação; atualize a tela se houver atendimentos simultâneos.

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

O acesso administrativo usa cookie de sessão HttpOnly, Secure em produção e SameSite=Strict; o token não deve ser copiado para armazenamento do navegador ou incluído em links. Configure CORS_ORIGINS somente com as origens reais do painel. As alterações autenticadas exigem essa origem. Login e cadastro público são limitados por IP em janelas de 15 minutos (15 e 30 solicitações, respectivamente); respostas 429 incluem Retry-After. Os contadores ficam na memória da API e atendem à implantação atual com uma instância. Caso a API passe a ter várias instâncias, use um armazenamento compartilhado para manter o mesmo limite entre elas.

Na configuração Compose, TRUST_PROXY_HOPS=2 corresponde a Caddy e Nginx na frente da API. Ao mudar a topologia, ajuste esse número de acordo com os proxies confiáveis; não habilite confiança irrestrita em cabeçalhos enviados pelo cliente. O servidor web envia política de conteúdo e demais cabeçalhos de segurança; confira-os no domínio publicado. O workflow `.github/workflows/security.yml` está configurado para verificar dependências e bloquear avisos altos/críticos, mas sua execução foi bloqueada pelo limite de cobrança da conta GitHub. Até regularizá-lo, execute as verificações localmente e publique manualmente; veja RENDER.md.

A configuração está preparada para um servidor Docker com domínio próprio:

1. Defina o mantenedor, a hospedagem e o acesso administrativo ao servidor.
2. Aponte o DNS do domínio para o servidor e libere as portas 80/443.
3. Configure PUBLIC_DOMAIN (somente domínio) e CORS_ORIGINS=https://DOMINIO no .env.
4. Execute `docker compose --profile https up -d --build`.
5. Confira certificado, login, formulário no celular, persistência e backup.

Caddy obtém o certificado para um domínio público válido. Os volumes de certificados precisam ser preservados. A implantação atual já usa HTTPS gerenciado pelo Render; os passos acima são uma alternativa para futura hospedagem própria. Felipe coordena o ambiente nesta entrega; o mantenedor institucional ainda precisa ser definido.

O banco do Compose fica na rede interna. Para PostgreSQL remoto, configure a API/migrador com DATABASE_URL remoto e DATABASE_SSL=true; use DATABASE_CA_FILE quando houver uma CA própria. A validação do certificado permanece habilitada.

## Dados e limites desta entrega

Utilize ambientes e bancos diferentes para demonstração e operação real. Não divulgue uma instalação que contenha pontos fictícios como pontos reais.

Formulário sem localização, configuração operacional dos pontos, QR Code e relatórios/CSV estão consolidados na versão da equipe. Veja [verificação da entrega](ENTREGA-FASEIV.md) e [publicação no Render](RENDER.md). A interface de notícias não integra esta entrega; a rota pública legada de consulta foi preservada.

A ativação pública depende também de conferir a infraestrutura escolhida, monitoramento, política de acessos e proteção contra abuso das rotas públicas/login. Os testes controlados desta entrega não são um piloto com a SEMA.

## Testes reproduzíveis

API: crie uma conta PostgreSQL local exclusiva com CREATEDB e um banco com prefixo meiu_faseiv_test. Configure TEST_DATABASE_URL em MEIU_API/.env.test.local e execute `npm test`. A suíte cria bancos temporários, testa a API real e remove apenas esses bancos ao terminar.

Painel: `npm run typecheck`, `npm run build`. Para testes de navegador, suba a instância local, crie um operador fictício, configure E2E_EMAIL e E2E_PASSWORD e execute `npm run test:e2e`. Por padrão usa Edge e http://localhost:8080/admin/. E2E_BROWSER, E2E_BASE_URL e E2E_API_URL permitem ajustar navegador/endereço; os testes aceitam apenas localhost. Em Linux/CI, instale Chromium com `npx playwright install chromium` e use E2E_BROWSER=chromium.

Formulário: `npm run build` em mobile-frontend. Os testes E2E criam pontos/pedidos fictícios, sem limpar automaticamente os dados do ambiente.

## Demonstração reproduzível

Use banco exclusivo de demonstração, sem dados reais. Cadastre um ponto fictício com limite de pelo menos 10 kg, horários e materiais. Registre 10 kg no formulário, guarde o QR/protocolo, entre no painel e confirme 8,7 kg. Confira 1 registro, 1 recebimento, 0 pendentes, 10 kg declarados e 8,7 kg recebidos no relatório e CSV. Uma correção para 8,6 kg deve exigir motivo e manter 1 recebimento. Filtrar pendentes deve retornar zero e CSV somente com cabeçalho.

## Continuidade por outra equipe

1. Solicite acesso ao GitHub e ao ambiente ao mantenedor; credenciais são entregues por canal privado, nunca em documentos ou vídeos.
2. Clone o repositório, use Node 24/PostgreSQL 16 ou Docker e reproduza o fluxo acima.
3. Leia API.md antes de alterar integrações. Use nova migração para mudanças no banco; não edite migrações já aplicadas.
4. Trabalhe em branch, abra pull request, peça revisão e execute os testes afetados. Confira os limites de validação em ENTREGA-FASEIV.md.
5. Faça backup antes de atualizar. Publique manualmente no Render e confira saúde, login e consultas; preserve o backup para recuperação.
6. Antes de uso contínuo, resolva a expiração do banco, indique mantenedor, contas individuais e rotina de backup externo protegido. Não compartilhe uma única conta entre operadores: o histórico usa a identidade autenticada.

## Lint

Em cada aplicação, execute `npm ci` e `npm run lint`. API e painel analisam fontes TypeScript e JavaScript, testes e configurações; o painel também aplica regras de Hooks e React Refresh às telas. Use Node 24. A validação não altera arquivos. Para correções automáticas na API ou no painel, execute `npm run lint:fix` e revise o diff.

O workflow executa lint nos três projetos com `--max-warnings=0`. Isso complementa compilação, checagem TypeScript e testes; não substitui nenhum deles. Enquanto o GitHub Actions estiver bloqueado, essas verificações precisam ser executadas localmente antes da publicação.
