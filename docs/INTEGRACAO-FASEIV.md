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

## Recebimento e correção

- GET /descartes: listagem administrativa, com os novos campos de recebimento.
- GET /descartes/protocolo/:protocolo: pedido, ponto e histórico. Busca exata, sem diferenciar maiúsculas.
- POST /descartes/:id/recebimento: { "peso_recebido_kg": 8.7 }. Retorna 200 com o pedido atualizado.
- PATCH /descartes/:id/recebimento: { "peso_recebido_kg": 8.6, "motivo": "Conferência da balança", "versao": 1 }.

Os quatro endpoints exigem login. 404 indica pedido inexistente; 400 indica campos inválidos; 409 indica operação incompatível com a situação/versão atual. Em 409, consultar novamente antes de reenviar.

Campos adicionados ao pedido:

| Campo | Significado |
| --- | --- |
| quantidade_kg | Peso declarado original; preservado. |
| peso_recebido_kg | Peso efetivamente recebido, null enquanto pendente. |
| recebido_em | Data/hora original do recebimento, ISO 8601 com fuso. |
| recebido_por | ID do operador que confirmou; definido pelo token. |
| recebimento_versao | 0 antes de receber, 1 ao confirmar; incrementa nas correções. |

A consulta por protocolo e as respostas de alteração incluem historico: id, versao, tipo (RECEBIMENTO/CORRECAO), peso_anterior_kg, peso_novo_kg, motivo, criado_em e operador { id, nome }. E-mail e hash de senha do operador não são retornados.

Confirmações concorrentes são serializadas no banco: somente uma tem sucesso; as demais retornam 409. Correções exigem a versão que o operador visualizou e motivo de 5 a 500 caracteres. Não existem aprovação prévia, recebimentos parciais ou edição geral do pedido.

## Link para o QR Code

José deve gerar o QR com o endereço público do painel e o protocolo codificado na query. Exemplo local:

http://localhost:8080/admin/?protocolo=TX-EXEMPLO

O painel preserva o protocolo ao pedir login, abre o pedido após autenticar e permite busca manual. O QR contém apenas o endereço/protocolo; não deve carregar tokens, senhas ou dados do material. O domínio real será definido na hospedagem.

## Base dos relatórios de José

- Registros: pedidos cadastrados. Não equivalem a pessoas únicas.
- Pendências: situacao = 'PENDENTE'.
- Recebimentos: situacao = 'RECEBIDO', um por pedido.
- Kg declarados: quantidade_kg.
- Kg recebidos: peso_recebido_kg somente dos pedidos RECEBIDO; pendentes não contam.
- A correção atualiza o peso recebido do pedido. O histórico é para auditoria: **não somar eventos de histórico como novas entregas**.
- Identificar na tela/CSV se o período usa criado_em ou recebido_em. recebido_em possui fuso; criado_em é um campo legado sem fuso no banco, que exige manter/explicitar a convenção do ambiente antes de comparar dados históricos.
- Relacionar ponto_coleta_id e residuo_principal aos filtros já previstos no plano.
- Manter zero/vazio coerentes e somas decimais no PostgreSQL. Exportar o mesmo conjunto filtrado da tela.
- Como a proteção é global, novas rotas administrativas permanecem protegidas. Marcar Public somente o que for realmente público.

A configuração operacional de pontos e as migrações correspondentes continuam na frente de José, com numeração de migrações posterior a 1793232002000. Não editar migrações que já tenham sido aplicadas em um ambiente compartilhado.
