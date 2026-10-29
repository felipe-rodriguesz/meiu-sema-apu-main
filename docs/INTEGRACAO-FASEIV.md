# Integração da frente de Felipe com José

Base: /api/v1. Valores numéricos são números JSON; kg aceitam até três casas decimais. Erros de validação retornam 400 com message. O frontend deve exibir a mensagem e manter o formulário preenchido.

## Acesso e pontos

Rotas administrativas exigem Authorization: Bearer <token>. Login: POST /auth/login, com email e senha. Sessão dura 8 horas; 401 exige novo login. O operador deve continuar cadastrado.

- GET /pontos-coleta: público, somente pontos ativos.
- GET /pontos-coleta/admin: autenticado, todos os pontos.
- POST /pontos-coleta e DELETE /pontos-coleta/:id?tipo=soft|hard|reativar: autenticados.
- Exclusão de ponto com pedidos retorna 409; utilizar desativação.
- GET /stats/latest: autenticado; total_kg continua sendo peso DECLARADO. José implementará relatórios de recebimento separadamente.
- GET /noticias: público, funcionalidade anterior preservada.

## Cadastro público

POST /descartes continua público. Exige ponto_coleta_id ativo, peso positivo de até 999999999.999 kg, frequência inteira positiva e campos de caracterização. lat/lon devem estar ambas preenchidas ou ambas ausentes; não representam origem comprovada. Nome/CPF/CNPJ não fazem parte do cadastro.

Resposta preservada: { protocolo, status: "success", ponto_coleta_id }. Não existe aprovação prévia.

José: corrigir a ausência de localização no formulário, remover coordenadas fictícias e mostrar mensagens da API. O backend já aceita ausência de coordenadas. Configuração dos pontos, QR Code e relatórios/CSV permanecem na sua frente.
