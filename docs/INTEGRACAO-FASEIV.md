# Integração da frente de Felipe com José

Base: /api/v1. Valores numéricos são números JSON; kg aceitam até três casas decimais. Erros de validação retornam 400 com message. O frontend deve exibir a mensagem e manter o formulário preenchido.

## Acesso e pontos

Rotas administrativas exigem sessão por cookie HttpOnly, recebido em POST /auth/login com email e senha. A resposta contém somente os dados básicos do operador; o token não é exposto ao JavaScript. O navegador envia o cookie automaticamente. GET /auth/me confirma a sessão e POST /auth/logout a encerra. A sessão dura 8 horas; 401 exige novo login. O operador deve continuar cadastrado. Para ações administrativas, o navegador envia a origem da página, que precisa estar em CORS_ORIGINS. Requisições sem origem ou de outra origem são recusadas. Login e cadastro público têm limite de tentativas por IP.

- GET /pontos-coleta: público, somente pontos ativos.
- GET /pontos-coleta/admin: autenticado, todos os pontos.
- POST /pontos-coleta, PUT /pontos-coleta/:id e DELETE /pontos-coleta/:id?tipo=soft|hard|reativar: autenticados.
- Exclusão de ponto com pedidos retorna 409; utilizar desativação.
- GET /stats/latest: autenticado; total_kg continua sendo peso DECLARADO. Os relatórios de recebimento usam /relatorios.
- GET /noticias: público, funcionalidade anterior preservada.

## Cadastro público

POST /descartes continua público. Exige ponto_coleta_id ativo, peso positivo de até 999999999.999 kg, frequência inteira positiva e campos de caracterização. lat/lon devem estar ambas preenchidas ou ambas ausentes; não representam origem comprovada. Nome/CPF/CNPJ não fazem parte do cadastro.

Resposta preservada: { protocolo, status: "success", ponto_coleta_id }. Não existe aprovação prévia.

A implementação do formulário permite registrar sem localização, remove coordenadas fictícias e mostra mensagens da API. A localização do aparelho serve somente para ordenar os pontos, sem ser enviada no pedido. Configuração dos pontos, QR Code e relatórios/CSV integram a versão consolidada da equipe.

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
| recebido_por | ID do operador que confirmou; definido pela sessão autenticada. |
| recebimento_versao | 0 antes de receber, 1 ao confirmar; incrementa nas correções. |

A consulta por protocolo e as respostas de alteração incluem historico: id, versao, tipo (RECEBIMENTO/CORRECAO), peso_anterior_kg, peso_novo_kg, motivo, criado_em e operador { id, nome }. E-mail e hash de senha do operador não são retornados.

Confirmações concorrentes são serializadas no banco: somente uma tem sucesso; as demais retornam 409. Correções exigem a versão que o operador visualizou e motivo de 5 a 500 caracteres. Não existem aprovação prévia, recebimentos parciais ou edição geral do pedido.

## Link para o QR Code

O formulário gera o QR com o endereço público do painel e o protocolo codificado na query. Exemplo local:

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
- Manter zero/vazio coerentes e somas precisas em gramas inteiras no relatório. Exportar o mesmo conjunto filtrado da tela.
- Como a proteção é global, novas rotas administrativas permanecem protegidas. Marcar Public somente o que for realmente público.

A migração local 1793232003000 adiciona condições de atendimento sem alterar as três anteriores. Não editar migrações que já tenham sido aplicadas em um ambiente compartilhado. A reversão é recusada quando removeria condições cadastradas.

## Condições dos pontos

POST cria; PUT substitui os dados editáveis, preservando ID, situação e vínculos. Nome e tipo são obrigatórios no PUT; envie o formulário completo. O painel usa horarios_semana e materiais_lista. Arrays vazios retiram os horários/materiais; cada dia incluído exige início e fim válidos.

| Campo | Regra |
| --- | --- |
| horarios_semana | Até 7 objetos { dia, inicio, fim }. dia é inteiro único de 0 (domingo) a 6 (sábado); início/fim em HH:mm, final posterior ao inicial no mesmo dia. |
| materiais_lista | Até 50 strings não vazias, únicas sem diferenciar maiúsculas. Até 2.000 caracteres por item para preservar textos legados; novos materiais digitados no painel têm até 120 caracteres. |
| orientacoes | Texto até 2.000 caracteres. |
| limite_kg_por_pedido | Número positivo até 999999999.999, no máximo três casas, ou null. Peso declarado acima do limite retorna 400. |

Dias e horários são orientações de entrega. Registro antecipado é permitido enquanto o ponto está ativo; encerrar a disponibilidade exige desativá-lo. O limite é por pedido; não equivale a capacidade diária ou limite por pessoa. Materiais são conferidos presencialmente, sem cruzamento automático de texto com o questionário.

A migração 1793232004000 copia o horário geral antigo para cada dia já selecionado e preserva o texto antigo de materiais como um item da lista. Horários antigos incompletos aparecem como não informados e exigem preenchimento ao editar. Os campos legados dias_semana, horario_inicio/fim, data_inicio/fim e materiais_aceitos permanecem no banco/API por compatibilidade; datas não são exibidas no cadastro nem na orientação pública. A API deriva dias_semana e o texto materiais_aceitos dos novos campos. O painel deve usar apenas o novo modelo. A reversão é recusada se houver horários ou materiais cadastrados.

## Consulta de relatórios

GET /relatorios e GET /relatorios/csv exigem token. Ambos aceitam os mesmos filtros opcionais:

- inicio / fim: YYYY-MM-DD, intervalo inclusivo e ordenado.
- base_data: registro (padrão) ou recebimento.
- ponto_coleta_id: UUID.
- residuo_principal: correspondência exata.
- situacao: PENDENTE ou RECEBIDO.

JSON retorna filtros, totais, por_ponto, por_residuo e registros. Cada total contém registros, pendentes, recebidos, peso_declarado_kg e peso_recebido_kg. Agrupamentos também retornam chave e nome. Soma de pesos usa gramas inteiras antes da conversão final para kg. Não são somados eventos do histórico.

criado_em retorna o calendário gravado (YYYY-MM-DD HH:mm:ss), sem reinterpretar o campo legado sem fuso. recebido_em retorna o calendário America/Sao_Paulo nesse mesmo formato. Período por recebimento exclui pedidos sem recebido_em. O CSV usa UTF-8/BOM, delimitador ;, vírgula decimal e cabeçalho mesmo sem resultados. Tela e CSV usam a mesma consulta filtrada; alterações simultâneas podem mudar os dados entre solicitações.
