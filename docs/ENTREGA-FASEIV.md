# Verificação da versão consolidada — 06/11/2026

Felipe autorizou a consolidação e publicação da implementação completa. Não há outra implementação de José a integrar. Os relatórios anteriores continuam como registros das verificações de cada etapa.

## Escopo implementado

Formulário público, pontos configuráveis com dias/horários e materiais, protocolo e QR Code, recebimento com peso aferido, correções auditadas, relatórios e CSV. Inclui responsividade do painel, preenchimento de bairro quando disponível, validações, cookies protegidos, controle de origem, limites por IP, cabeçalhos de segurança e proteção de arquivos sensíveis.

## Verificações

- API: 18 testes aprovados com PostgreSQL real, incluindo migrações, autorização, concorrência, relatórios e limites de tentativas. Variações de maiúsculas/barra final também respeitam os limites.
- Imagem `Dockerfile.render`: compilada do zero, com os três componentes; execução sem privilégios e somente dependências de produção.
- Navegador: 18 testes aprovados em uma execução completa contra a imagem de produção e banco exclusivo de homologação. Cobertura de desktop/celular emulado, formulário, QR, recebimento, correção, CSV, horários, materiais e geocodificação.
- Cabeçalhos: política de conteúdo presente em `/` e `/admin/`; API administrativa retorna 401 sem sessão; `/.env` retorna 404.
- Backup: dump restaurado em banco separado; origem e restauração coincidiram em 4 pedidos, 40 kg declarados, 34,6 kg recebidos e 6 eventos. A conferência deve ser repetida no ambiente publicado.
- Dependências de produção: a API mantém nove avisos moderados e nenhum alto/crítico. Os caminhos afetados não estão expostos pelos recursos atuais; detalhes e limites em [RENDER.md](RENDER.md).

Os testes criaram somente dados fictícios no ambiente local isolado. Ainda não houve piloto real nem teste em celular físico. Para a entrega, a equipe precisa registrar essas distinções nos documentos e vídeos.

## Publicação

Render gratuito escolhido por Felipe. A configuração mantém formulário, painel e API na mesma origem HTTPS, com PostgreSQL separado e migrações no início. O workflow foi criado, mas o GitHub bloqueou a execução por restrição de cobrança/limite da conta. Até regularizar, novas publicações são manuais, após validar localmente compilações, dependências e testes.

Em 08/11/2026, o Render mostrava o commit `6a9c463` ativo no plano gratuito. O [formulário](https://meiu-sema-apucarana.onrender.com/) e o [painel](https://meiu-sema-apucarana.onrender.com/admin/) responderam por HTTPS. A listagem pública respondeu com sucesso, a API administrativa retornou 401 sem sessão e a tentativa de acessar `/.env` retornou 404. CSP e HSTS estavam presentes nas respostas.

O primeiro operador foi cadastrado. O login, o cookie seguro, a consulta de sessão, os relatórios e a exportação CSV foram conferidos por HTTPS. O backup inicial do Render foi restaurado em um banco local isolado, com um operador e sem pedidos ou eventos. O acesso externo ao PostgreSQL foi bloqueado novamente após a manutenção.

O banco `meiu-sema-db` expira em **06/12/2026**, conforme o painel do Render. Exporte uma cópia atualizada antes dessa data.
