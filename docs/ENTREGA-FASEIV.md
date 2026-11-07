# Verificação da versão consolidada — 06/11/2026

Felipe autorizou a consolidação e publicação da implementação completa. Não há outra implementação de José a integrar. Os relatórios anteriores continuam como registros das verificações de cada etapa.

## Escopo implementado

Formulário público, pontos configuráveis com dias/horários e materiais, protocolo e QR Code, recebimento com peso aferido, correções auditadas, relatórios e CSV. Inclui responsividade do painel, preenchimento de bairro quando disponível, validações, cookies protegidos, controle de origem, limites por IP, cabeçalhos de segurança e proteção de arquivos sensíveis.

## Verificações

- API: 18 testes aprovados com PostgreSQL real, incluindo migrações, autorização, concorrência, relatórios e limites de tentativas. Variações de maiúsculas/barra final também respeitam os limites.
- Imagem `Dockerfile.render`: compilada do zero, com os três componentes; execução sem privilégios e somente dependências de produção.
- Navegador: 18 testes aprovados em uma execução completa contra a imagem de produção e banco exclusivo de homologação. Cobertura de desktop/celular emulado, formulário, QR, recebimento, correção, CSV, horários, materiais e geocodificação.
- Cabeçalhos: política de conteúdo presente em `/` e `/admin/`; API administrativa retorna 401 sem sessão; `/.env` retorna 404.
- Backup: dump restaurado em banco separado, sem substituir o banco de origem. A conferência de totais deve ser repetida no ambiente publicado.
- Dependências de produção: a API mantém nove avisos moderados e nenhum alto/crítico. Os caminhos afetados não estão expostos pelos recursos atuais; detalhes e limites em [RENDER.md](RENDER.md).

Os testes criaram somente dados fictícios no ambiente local isolado. Ainda não houve piloto real nem teste em celular físico. Para a entrega, a equipe precisa registrar essas distinções nos documentos e vídeos.

## Publicação

Render gratuito escolhido por Felipe. A configuração mantém formulário, painel e API na mesma origem HTTPS, com PostgreSQL separado e migrações no início. O pipeline verifica compilações, dependências e testes da API antes de novas publicações.

A liberação do endereço público depende de concluir a conexão do repositório ao Render, criar os serviços gratuitos, cadastrar o operador e validar o fluxo/backup no ambiente publicado. A expiração do banco gratuito deve ser registrada a partir da data efetiva de criação.
