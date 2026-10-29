# Plano de execução — Fase IV

Atualizado em 28/10/2026. Objetivo: entregar relatórios confiáveis e viabilizar um atendimento real em um ponto de coleta supervisionado, priorizando pequenos geradores, sem excluir outros públicos aceitos pela SEMA.

## 1. Prioridades da Fase IV

**Estado atual conferido:** login administrativo, cadastro/ativação/desativação de pontos, formulário de cinco etapas, protocolo, busca e consulta de pedidos já existem. Ainda não há baixa de recebimento, peso aferido, QR Code, informações de funcionamento do ponto nem tela de relatórios com exportação. As estatísticas existentes somam pesos declarados; não medem recebimentos. Há somente uma estrutura inicial de consulta de notícias.

A consulta de pedidos pela API continua sem proteção, o peso é inteiro no banco, a geolocalização usa coordenadas substitutas e a exclusão de ponto vinculado não trata o impedimento. A conferência do código foi estática; os testes funcionais disponíveis são de 20/10. Nenhuma correção foi implementada nesta atualização do plano.

| Ordem | Prioridade e ação | Resultado esperado |
| --- | --- | --- |
| 1 | **Validar as definições finais com Leandro e preparar a operação.** Fechar regras do atendimento, relatórios, localização, ponto real, operador, recursos e divulgação. Avançar em paralelo às correções. | Escopo mínimo e condições do piloto confirmados, com responsáveis e datas. |
| 2 | **Ajustar a base existente.** Proteger consultas administrativas; aceitar pesos decimais; validar frequência; eliminar localização fictícia; corrigir contraste e mensagens; tratar exclusão de ponto com pedidos vinculados. | Formulário e painel utilizáveis em celular, sem exposição administrativa nem erros internos nos casos previstos. |
| 3 | **Desenvolver recebimento e pesagem.** Reutilizar pedido/protocolo, guardar peso recebido separadamente do declarado e registrar situação, data e operador. Impedir baixa duplicada. | Operador encontra o pedido e confirma uma entrega uma única vez, sem perder o valor declarado. |
| 4 | **Desenvolver relatórios e exportação.** Mostrar registros, recebimentos, pendências, pesos declarados/recebidos e agrupamentos por ponto e tipo de resíduo; filtrar e exportar. | Tela e arquivo apresentam os mesmos resultados, com significado claro para cada indicador. |
| 5 | **Completar o ponto e o protocolo para atendimento.** Acrescentar datas/horários, materiais aceitos, limites e orientações; mostrar QR Code simples e manter busca manual. Preparar essa frente em paralelo às prioridades 3 e 4. | Gerador sabe onde e quando entregar; operador localiza o registro; somente ponto operacional é divulgado. |
| 6 | **Demonstrar, testar com usuários reais e corrigir.** Fazer verificação interna antes da divulgação; acompanhar atendimentos, registrar falhas e retestar as correções. | Pelo menos um atendimento real completo, resultados conferidos pela SEMA e evidências para a entrega. |
| 7 | **Notícias — opcional e última prioridade.** Considerar conteúdo informativo simples somente depois da entrega mínima funcional, dos testes e das correções, com conteúdo e responsável definidos pela SEMA. | Complemento apenas se houver capacidade, sem comprometer 19/11; caso contrário, fica para depois. |

## 2. Entrega mínima recomendada

### Obrigatório para a versão mínima

- **Registro sem identificação pessoal obrigatória:** manter formulário, seleção de ponto e protocolo; aceitar peso fracionado e tratar localização negada/ausente sem inventar coordenadas. Explicar o que é coletado; posição do aparelho não equivale automaticamente ao local de geração.
- **Um ponto real supervisionado:** endereço, datas/horários, materiais, limites e orientações confirmados. Reutilizar cadastro e ativação existentes; permitir preenchimento manual de endereço/bairro. Não é necessário desenvolver agendamento ou roteirização.
- **Recebimento autenticado:** localizar pelo protocolo/QR Code, conferir material, registrar peso aferido, data, operador e passagem proposta de `PENDENTE` para `RECEBIDO`. A confirmação repetida não duplica registros nem totais. Correções devem ser rastreáveis, sem apagar a entrega original.
- **Relatório simples e exportável:** número de registros, recebidos e pendentes; kg declarados e recebidos separados; resultados por ponto e tipo de resíduo. Filtros mínimos: período, ponto, tipo de resíduo e situação. Proposta: CSV; formato e campos devem ser validados até 30/10. Identificar se o período usa data de registro ou de recebimento.
- **Ambiente acessível para o piloto:** link utilizável em celular, conta do operador, persistência dos dados, cópia de segurança e instruções curtas. Dados fictícios devem ficar separados dos reais. Consultas administrativas, recebimento e relatórios precisam exigir autenticação.
- **Validação e entrega:** atendimento real documentado, correções verificadas, aceite de Leandro, código organizado e informações/evidências entregues a Benedito e Maria para os documentos e vídeos.

**Limites a validar até 30/10:** protocolo como comprovante ou autorização prévia; necessidade de recusa, cancelamento e entrega parcial; informação de origem necessária; formato do relatório. O QR Code simples está previsto; só adiar se Leandro aceitar expressamente a busca manual para o piloto. Não implementar aprovação, recebimentos parciais ou uma cadeia de situações sem necessidade confirmada.

### Fluxo para demonstrar um atendimento real

1. Leandro divulga o link, o ponto, a data, os horários e as condições de entrega para pessoas que possam participar dos testes.
2. Um gerador real preenche o formulário, informa a quantidade, escolhe o ponto confirmado e guarda o protocolo/QR Code, sem exigência de nome, CPF ou CNPJ.
3. No ponto e horário combinados, o operador autenticado encontra o protocolo por leitura do código ou busca manual, confere o material e faz a pesagem.
4. O operador confirma o recebimento. O sistema preserva a declaração inicial e registra peso aferido, data, operador e situação.
5. A SEMA consulta e exporta o relatório; o atendimento aparece uma única vez, com o peso recebido correto. O responsável local encaminha o material conforme o destino combinado.
6. Felipe e José registram dificuldades e correções; Benedito e Maria recebem as evidências e os resultados efetivamente obtidos.

### Critérios de conclusão e validação

- [ ] Acesso administrativo sem credencial válida é recusado pela API; registro público e consulta pública do ponto continuam funcionando.
- [ ] Um registro de **2,5 kg** é salvo e exibido corretamente. Frequência inválida recebe mensagem clara; ponto inativo não aceita novo pedido; ponto com pedidos vinculados pode ser desativado sem perder registros e não provoca erro interno ao tentar excluir.
- [ ] Com geolocalização negada, nenhum valor substituto é salvo como real; o comportamento segue a regra validada com Leandro.
- [ ] Em teste controlado, **10 kg declarados e 8,7 kg recebidos** permanecem distintos; repetir a confirmação mantém uma entrega de 8,7 kg. Pendências não entram como peso recebido.
- [ ] Tela e CSV coincidem para os mesmos filtros, inclusive resultado vazio; datas de referência estão identificadas. Não apresentar registros anônimos como pessoas únicas nem bairro do ponto como área de geração.
- [ ] Um ponto real está preparado e pelo menos um atendimento real completa todo o fluxo em celular e painel, com protocolo, pesagem, recebimento e relatório conferidos.
- [ ] Não há falhas abertas que exponham dados administrativos, impeçam registro/recebimento ou alterem os totais. Ajustes foram retestados; Leandro validou o uso e os resultados; instruções e evidências estão disponíveis.

A baixa confirma **recebimento**, não comprova a destinação posterior. Só apresentar destinação como resultado se houver evidência própria. Se a operação real não for viabilizada, entregar em 19/11 o que estiver comprovado e registrar a validação de campo como pendente; uma simulação não conclui esse critério.

### Melhorias que podem ficar para depois

PDF e formatos adicionais; atualização contínua dos indicadores; mapa de calor/recortes geográficos sem origem validada; preenchimento automático de bairro; edição/exclusão geral de pedidos; gestão completa da destinação; catálogos administráveis; roteirização, aplicativo nativo e cobrança. Não criar cadastro pessoal obrigatório. Notícias seguem exclusivamente a condição da prioridade 7.

## 3. Plano de desenvolvimento e entregas

**Prazo registrado: 19/11/2026 para documentos e vídeos.** O plano propõe início em 29/10, validação final em 17/11 e pacote pronto em 18/11. As datas intermediárias são propostas, não compromissos já confirmados. Não há trabalho obrigatório previsto em fins de semana nem em 02/11. As apresentações de 25–27/11 não prorrogam a entrega.

**Divisão proposta:** Felipe lidera banco/API de pedidos, segurança, recebimento, ambiente e contato com Leandro. José lidera formulário/pontos, QR Code e relatórios, incluindo a API de consulta/exportação. Ambos revisam e testam as entregas do outro. A atuação de ambos no código está confirmada; a distribuição por módulo é proposta, sem pressupor diferença de experiência. Benedito e Maria continuam responsáveis pela documentação e pelos relatórios acadêmicos.

**Organização:** confirmar disponibilidade semanal e acesso ao GitHub até **29/10**. Definir até **30/10** os campos e respostas da API de recebimento/relatórios; Felipe coordena as alterações de banco. Isso permite que José prepare interfaces e consultas sem aguardar a integração final. Usar uma branch por tarefa e revisão pelo colega. Cada entrega deve gerar descrição, horas efetivas, evidências e link do código para Benedito e Maria.

| Ordem | Atividade ou entrega | Responsável principal e colaboração | Prazo proposto | Dependências | Critério de conclusão |
| --- | --- | --- | --- | --- | --- |
| 1 | **Validação das definições finais** e acordo de campos da API | **Felipe**; José participa; Leandro valida | 29–30/10 | Disponibilidade da dupla e retorno de Leandro | Regras da seção 2, conteúdo do relatório, origem dos dados, ambiente e condições do piloto definidos por escrito. |
| 2 | Corrigir segurança, decimais e validações da API/banco | **Felipe**; José confere integração | 29/10–03/11 | Início independente; regras finais da 1 para fechar | Consultas protegidas, decimal persistido e casos inválidos tratados; alteração de banco reproduzível. |
| 3 | Ajustar formulário, ponto e protocolo/QR Code | **José**; Felipe apoia integração | 29/10–03/11 | 1 para textos/regras; 2 para verificação integrada | Sem coordenada fictícia; campos legíveis; informações de funcionamento e QR/busca manual conforme decisão; API do ponto compatível. |
| 4 | **Confirmar ponto real e data do atendimento** | **Felipe** acompanha; Leandro/SEMA confirma | Até 03/11 | 1 | Local autorizado, operador, datas/horários, materiais, capacidade, balança, armazenamento e destino confirmados. |
| 5 | Implementar recebimento no banco, API e painel | **Felipe**; José revisa | 03–05/11 | 1 e 2; protocolo existente | Peso declarado e recebido separados; data/operador/situação registrados; busca e baixa sem duplicação. |
| 6 | Implementar relatórios, filtros e CSV | **José**; Felipe fornece dados de teste | 04–05/11 | Campos acordados na 1; integração com 5 | Tela/exportação protegidas e equivalentes; indicadores não confundem declaração com recebimento. |
| 7 | Disponibilizar ambiente do piloto e acessos | **Felipe**; José testa em celular | 03–05/11 | Escolha e acesso à hospedagem/banco na 1 | Link HTTPS, API e banco acessíveis; conta do operador; dados de teste separados; cópia de segurança conferida. |
| 8 | **Preparar o ponto real** e orientar o operador | **Leandro/SEMA**; Felipe acompanha; José apoia uso | 04–05/11 | 4; 3, 5 e 7 para orientar no sistema | Recursos e destino disponíveis; ponto cadastrado corretamente; operador sabe localizar protocolo, pesar e confirmar recebimento. |
| 9 | **Concluir o fluxo para a demonstração** e liberar o piloto | **Felipe**; José executa revisão cruzada | 06/11, antes da divulgação | 2, 3, 5, 6, 7 e 8 | Fluxo completo aprovado com dados fictícios separados, inclusive duplicação, ausência de localização e conferência do CSV; sem falha impeditiva. |
| 10 | **Divulgação para atrair usuários reais** | **Leandro** publica; Felipe acompanha; José confere link | 06/11; reforço em 09/11 | 4, 8 e liberação da 9 | Divulgação enviada com link, local, data, horários e materiais; Leandro confirma interessados até 09/11. |
| 11 | **Demonstração e testes com usuários reais** | **Felipe** conduz; José acompanha falhas; SEMA atende | 10–11/11 | 9, 10 e participantes disponíveis | Pelo menos um atendimento real completo; demais testes conforme capacidade; evidências e lista de ajustes registradas. |
| 12 | Corrigir problemas encontrados e retestar | **José** organiza; Felipe corrige API/banco/ambiente | 12–13/11 | 11 | Falhas impeditivas resolvidas, testes repetidos e totais reconciliados; cada correção com responsável. |
| 13 | Reserva para ajustes e repetição de testes | **Felipe**; José colabora | 16/11 | 12 | Fluxo estabilizado; nenhuma funcionalidade nova ocupa esta margem. |
| 14 | **Validação final com Leandro** | **Felipe** obtém validação; José demonstra resultados | 17/11 | 11, 12 e 13 | Critérios da seção 2 conferidos; aceite e eventuais limitações registrados. |
| 15 | Consolidar versão, instruções e evidências | **José** organiza pacote técnico; Felipe revisa; Benedito/Maria consolidam documentos e vídeos | 18/11; evidências fornecidas ao longo do plano | 14; documentação em andamento | Código identificado por versão/commit, instruções, testes, resultados reais e materiais finais conferidos. |
| 16 | **Entrega da Fase IV** | **Felipe** confere; José apoia; Benedito/Maria respondem pelos arquivos acadêmicos | **19/11** | 15 | Documentos e vídeos nas pastas previstas; código e instruções acessíveis; links e recebimento conferidos. |
| 17 | Notícias, se houver capacidade | **José**; Felipe revisa; SEMA fornece conteúdo | Somente após mínimo, testes, correções e validação; sem reserva obrigatória | 14 e 15 concluídas, sem risco à 16 | Funcionalidade simples validada ou explicitamente adiada, sem bloquear a entrega. |

As atividades 2 e 3 avançam em paralelo; depois, 5 e 6. A preparação externa do ponto acompanha o desenvolvimento. A divulgação em 06/11 deixa quatro dias corridos antes do primeiro teste, com reforço e confirmação de participantes em 09/11. A janela de 12–16/11 fica reservada para correções e retestes.

### Pendências externas e datas-limite

- **Até 30/10 — Leandro:** validar regras de autorização/recebimento, relatórios, localização e necessidade de QR; combinar público, canal e conteúdo da divulgação. **SEMA/orientação:** confirmar onde o piloto ficará disponível, acesso ao ambiente e quem manterá os dados. Sem essas decisões, não fechar funcionalidades dependentes nem divulgar operação sem suporte.
- **Até 03/11 — Leandro/SEMA:** confirmar um ponto real e os recursos da atividade 4. **Até 05/11:** comprovar a preparação e a disponibilidade do operador. Falta de local, balança, armazenamento ou destino bloqueia a liberação do piloto.
- **06/11 — Leandro:** realizar a divulgação após liberação técnica. **Até 09/11:** confirmar participantes; se não houver adesão, fazer convite direcionado a geradores que possam comparecer em 10–11/11. Convite enviado não comprova participação.
- **17/11 — Leandro:** validar resultados e limitações. Se qualquer pendência ameaçar as janelas de testes/correções, Felipe aciona Leandro e a orientação no mesmo dia para replanejar ou registrar impedimento. Manter 19/11 como prazo de entrega; não eliminar os testes para acomodar funcionalidades opcionais.
