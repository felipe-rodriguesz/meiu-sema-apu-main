# Plano de desenvolvimento — Fase IV

Objetivo: entregar um sistema funcional e preparado para um piloto em pontos de coleta supervisionados que a SEMA cadastrar, com relatórios confiáveis, instruções de operação e testes internos concluídos.

O desenvolvimento seguirá por etapas, conforme a disponibilidade de Felipe e José, sem datas intermediárias fixas. A referência final permanece **19/11/2026 para documentos e vídeos**. O teste com usuários reais será uma oportunidade adicional, condicionada à disponibilidade da SEMA e ao tempo para executar, corrigir e retestar.

## 1. Prioridades da Fase IV

**Base de partida:** já existem login administrativo, cadastro/ativação/desativação de pontos, formulário, protocolo e consulta de pedidos. Precisam de ajustes a proteção da API, os pesos decimais, a localização, a interface e o tratamento de erros. Recebimento, peso aferido, QR Code, informações de funcionamento dos pontos e relatórios com exportação ainda precisam ser desenvolvidos. As estatísticas existentes somam pesos declarados; não representam recebimentos.

| Ordem | Prioridade | Resultado esperado |
| --- | --- | --- |
| 1 | Corrigir segurança, validações e falhas do fluxo existente. | Acesso administrativo protegido; pesos decimais aceitos; localização sem valores fictícios; mensagens e campos compreensíveis. |
| 2 | Implementar recebimento e pesagem no banco, API e painel. | Operador encontra o protocolo, registra peso aferido e confirma a entrega sem duplicação. |
| 3 | Implementar relatórios, filtros e exportação CSV. | Registros, pendências e recebimentos consultáveis, com pesos declarados e recebidos separados. |
| 4 | Completar a configuração dos pontos e o protocolo/QR Code. Trabalhar em paralelo às prioridades 2 e 3. | A SEMA consegue preparar um novo ponto no painel, sem alterar código; o gerador recebe as orientações de entrega. |
| 5 | Disponibilizar o ambiente, testar o fluxo completo e corrigir falhas. | Versão acessível, estável nos cenários testados e pronta para uma demonstração controlada. |
| 6 | Preparar a entrega e apresentar a versão a Leandro. Avaliar um piloto real se houver condições. | Instruções, evidências e acessos organizados; SEMA informada sobre como iniciar o uso. |
| 7 | **Notícias — opcional e última prioridade.** | Implementar somente após o mínimo técnico, os testes e as correções, com conteúdo definido e sem prejudicar a entrega ou um piloto viável. |

## 2. Entrega mínima recomendada

### Regras definidas para implementação

- **Registro automático, sem aprovação prévia:** o gerador preenche o formulário, escolhe um ponto ativo e recebe o protocolo/QR Code. Nome, CPF e CNPJ não são obrigatórios. O protocolo comprova o registro; a aceitação do material ocorre na conferência presencial.
- **Pontos configuráveis:** permitir cadastrar e atualizar endereço, dias/datas, horários, materiais aceitos, limites e orientações, além de ativar/desativar. Reutilizar o cadastro existente e manter preenchimento manual de endereço/bairro. O funcionamento deve atender novos pontos supervisionados sem mudanças no código.
- **Recebimento autenticado:** localizar o pedido por QR Code ou busca manual, conferir o material, registrar peso aferido, data e operador e alterar `PENDENTE` para `RECEBIDO`. Preservar o peso declarado e impedir confirmação duplicada. Eventuais correções devem ser rastreáveis.
- **Relatórios e CSV:** mostrar registros, recebimentos, pendências, kg declarados e kg recebidos; agrupar por ponto e tipo de resíduo. Filtrar por período, ponto, resíduo e situação, identificando a data usada no filtro. Exportar exatamente os resultados filtrados.
- **Dados coerentes:** aceitar peso fracionado; rejeitar frequência inválida com mensagem clara; manter localização não informada quando não obtida ou confirmada. Não usar a posição do aparelho ou o bairro do ponto como origem comprovada do resíduo. Registros anônimos não equivalem a pessoas únicas.
- **Ambiente de uso:** disponibilizar link HTTPS acessível pelo celular, API e banco persistentes, conta administrativa do operador e cópia de segurança. Definir quem mantém o ambiente e os acessos. Separar dados fictícios dos reais.
- **Material de entrega:** código organizado, instruções para configurar ponto e operar o atendimento, demonstração com dados fictícios, resultados dos testes e limitações conhecidas. Benedito e Maria recebem as evidências para os documentos e vídeos.

### Fluxo que deve funcionar

1. A SEMA cadastra/configura um ponto e suas condições de funcionamento.
2. O gerador preenche o formulário, seleciona o ponto ativo e guarda o protocolo/QR Code.
3. O operador autenticado localiza o pedido, confere o material e informa o peso aferido.
4. O sistema confirma o recebimento, preserva a declaração inicial e impede duplicação.
5. A SEMA consulta os resultados e exporta o CSV, com o recebimento contabilizado corretamente.

Esse fluxo será testado primeiro com pontos e dados fictícios. Quando houver uso real, a SEMA também deverá organizar o atendimento, a balança, o armazenamento e o destino dos materiais. A confirmação no sistema comprova recebimento; a destinação posterior exige evidência própria.

### Critérios para concluir a entrega técnica

- [ ] Consultas e ações administrativas exigem autenticação; formulário público e informações públicas dos pontos continuam acessíveis.
- [ ] Um registro de **2,5 kg** é salvo corretamente; entradas inválidas recebem mensagens claras; pontos inativos não aceitam novos pedidos. A tentativa de excluir ponto vinculado é tratada sem erro interno, preservando a desativação e os registros.
- [ ] Geolocalização negada/ausente não gera coordenadas fictícias nem impede indevidamente o fluxo.
- [ ] Em teste controlado, **10 kg declarados e 8,7 kg recebidos** permanecem separados. Repetir a confirmação mantém uma única entrega de 8,7 kg; pendências não entram como peso recebido.
- [ ] Tela e CSV coincidem para os mesmos filtros, inclusive quando não há resultados; a referência de período está clara.
- [ ] É possível cadastrar/configurar outro ponto fictício e completar o fluxo em celular e painel, usando QR Code e busca manual, sem alterar o código.
- [ ] O ambiente está acessível, os dados persistem, a cópia de segurança foi conferida e existem instruções de operação e manutenção.
- [ ] Não há falhas abertas que exponham dados administrativos, impeçam registro/recebimento ou produzam totais incorretos. As correções foram retestadas e as evidências estão organizadas.

**Atendimento real e aceite operacional de Leandro não bloqueiam a conclusão técnica.** Sem piloto, apresentar o resultado como **“sistema preparado para piloto e validado em testes controlados”**, com validação de campo pendente. Testes internos não garantem ausência de problemas em condições reais.

## 3. Plano de desenvolvimento e entregas

**Divisão de trabalho:** Felipe lidera segurança, banco/API de pedidos, recebimento, ambiente e contato com Leandro. José lidera formulário, configuração dos pontos, QR Code e relatórios, incluindo consulta/exportação na API. Ambos revisam e testam as entregas do outro. Benedito e Maria continuam responsáveis pelos documentos e relatórios acadêmicos. A distribuição por módulo pode ser ajustada entre Felipe e José conforme a disponibilidade.

**Organização:** definir os campos da API antes de dividir as implementações; Felipe coordena as alterações de banco. Usar uma branch por tarefa, revisão pelo colega e registrar atividades, horas efetivas, evidências e links para Benedito e Maria. Avançar o mais rápido que a disponibilidade permitir, preservando tempo para testes, correções e preparação da entrega.

| Etapa | Atividade ou entrega | Responsável principal e colaboração | Dependências | Critério de conclusão |
| --- | --- | --- | --- | --- |
| 1 | Organizar tarefas, campos da API e ambiente de desenvolvimento. | **Felipe**, com José. | Disponibilidade e acesso de ambos. | Tarefas divididas, dados e integrações definidos, ambiente local utilizável. |
| 2 | Corrigir segurança, decimais e validações da API/banco. | **Felipe**; José confere integração. | 1. | Consultas protegidas, decimais persistidos e erros tratados; alteração de banco reproduzível. |
| 3 | Ajustar formulário, configuração dos pontos e QR Code. | **José**; Felipe apoia integração. | 1; integração com 2. | Campos e orientações utilizáveis, localização correta e protocolo/QR disponíveis. |
| 4 | Implementar recebimento no banco, API e painel. | **Felipe**; José revisa. | 1 e 2. | Peso aferido, data, operador e situação registrados, sem duplicação. |
| 5 | Implementar relatórios, filtros e CSV. | **José**; Felipe fornece dados de teste. | Campos da 1; integração final com 4. | Indicadores e exportação protegidos, coerentes e equivalentes. |
| 6 | Preparar hospedagem, banco, acessos e cópia de segurança. | **Felipe**; José testa pelo celular. | 1 e recursos do ambiente. | Link HTTPS funcional, dados persistentes e manutenção definida. |
| 7 | Executar testes internos do fluxo completo e dos casos de erro. | **Felipe**; José faz revisão cruzada. | 2 a 6. | Critérios da seção 2 verificados; falhas e evidências registradas. |
| 8 | Corrigir falhas e repetir os testes afetados. | **José** organiza; Felipe corrige sua frente. | 7. | Falhas impeditivas resolvidas e resultados conferidos novamente. |
| 9 | Preparar demonstração, instruções e evidências da versão estável. | **José**; Felipe revisa; Benedito/Maria consolidam documentos e vídeos. | 7 e 8; documentação acompanhando o desenvolvimento. | Versão identificada por commit, demonstração controlada e material de uso prontos. |
| 10 | Contatar Leandro antes da entrega final e apresentar como operar um ponto real. | **Felipe**; José apoia a demonstração. | Versão estável e material da 9. | Funcionamento explicado e interesse/viabilidade de divulgação e piloto consultados. A resposta não bloqueia a entrega técnica. |
| 11 | **Piloto real opcional:** preparar ponto, divulgar e acompanhar atendimentos. | **Felipe** coordena; José acompanha falhas; Leandro/SEMA organiza operação e divulgação. | 10; condições operacionais e tempo para testar, corrigir e retestar. | Se realizado, evidências reais e resultados conferidos; ajustes retornam à etapa 8 e atualizam o material da 9. |
| 12 | Consolidar e entregar a Fase IV. | **Felipe** confere; José apoia; Benedito/Maria respondem pelos arquivos acadêmicos. | 9; incorporar resultados da 11 se houver. | Código, instruções, documentos e vídeos acessíveis; verificações e limitações descritas corretamente. |

As etapas 2 e 3 podem avançar em paralelo; depois, 4 e 5. A preparação do ambiente pode acompanhar a implementação. A integração final e os testes completos dependem da conclusão das frentes necessárias. Cada melhoria deve ser verificada durante o desenvolvimento, sem deixar toda a checagem para o final.

### Condições para o teste real

O piloto só será iniciado quando houver versão estável, disponibilidade da SEMA e tempo para tratar os resultados. Leandro deverá definir ponto, datas/horários de atendimento, operador, balança, materiais e quantidades aceitos, armazenamento, destino e divulgação para atrair participantes.

Se essas condições não forem atendidas antes da entrega final, o sistema e as instruções serão entregues preparados para uso experimental posterior. A ausência do piloto deve ficar explícita; não ampliar funcionalidades opcionais nem eliminar testes internos para tentar encaixar um atendimento real.
