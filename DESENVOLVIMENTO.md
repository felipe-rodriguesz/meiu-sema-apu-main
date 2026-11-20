# Fase IV — escopo e conclusão

Objetivo: disponibilizar uma versão funcional para piloto supervisionado pela SEMA. A entrega de documentos e vídeos permanece prevista para **19/11/2026**, conforme cronograma registrado do projeto. Piloto real é opcional e depende das condições operacionais e de tempo para corrigir eventuais falhas.

## Entrega mínima e estado atual

| Prioridade | Resultado | Situação em 09/11/2026 |
| --- | --- | --- |
| 1 | Autenticação, validações, decimais, migrações e proteção de dados administrativos. | Implementado; ressalvas de segurança e ferramentas em ENTREGA-FASEIV. |
| 2 | Recebimento por protocolo/QR, pesagem separada e correções auditadas, sem duplicação. | Implementado e testado. |
| 3 | Relatórios e CSV por período, ponto, tipo e situação. | Implementado e testado. |
| 4 | Pontos editáveis, horários por dia, materiais, limite e orientações; formulário com localização opcional. | Implementado e testado. |
| 5 | Publicação HTTPS, persistência, conta administrativa e backup recuperável. | Publicado; restauração validada em 08/11. Hospedagem temporária. |
| 6 | Transferência de conhecimento, documentos/vídeos e avaliação do piloto. | Instruções disponíveis; entrega acadêmica e validação operacional pendentes. |
| 7 | Notícias, opcionais e por último. | Não implementada nova interface; rota legada preservada. Só retomar após mínimo, testes e correções. |

## Regras de funcionamento

- Registro automático, sem aprovação prévia. Protocolo comprova registro, e aceitação ocorre na conferência presencial.
- Nome, CPF e CNPJ não são solicitados. Localização do aparelho apenas ordena pontos; não representa origem comprovada do resíduo.
- Ponto ativo aceita registro antecipado. Horários orientam a entrega; não são agendamento. Materiais são conferidos pelo operador. Limite em kg é por pedido, não por pessoa ou dia.
- Peso declarado permanece separado do aferido. Data e operador são definidos no servidor. Correção exige motivo e preserva histórico.
- Pendências não entram no peso recebido; eventos de correção não são novas entregas. Registros anônimos não são geradores únicos.
- Relatórios usam explicitamente data de registro ou recebimento; CSV aplica os mesmos filtros. Não há comprovação automática da destinação posterior.

## Critérios de validação

Fluxo: configurar ponto → registrar resíduo → guardar protocolo/QR → autenticar operador → conferir e pesar → confirmar recebimento → consultar/exportar relatório. O fluxograma com raias por ator, decisões e referências ao código está em [FLUXO-PROCESSO](docs/FLUXO-PROCESSO.md).

Os testes controlados conferem decimais (2,5 kg), localização ausente, ponto inativo, exclusão vinculada, 10 kg declarados/8,7 kg recebidos, confirmação concorrente, correções, CSV e telas de desktop/celular emulado. Resultados e limites estão em [ENTREGA-FASEIV](docs/ENTREGA-FASEIV.md). Não declarar ausência absoluta de bugs nem validação em campo.

## Responsabilidades e próximos passos

A divisão inicial previa desenvolvimento com José. A implementação e consolidação da Fase IV foram realizadas por Felipe, que assumiu também as frentes previstas para José. Benedito e Maria cuidam dos documentos e relatórios acadêmicos. Essa atribuição refere-se à Fase IV; preserva-se a autoria do sistema anterior.

| Ordem | Entrega | Responsável | Dependência e conclusão |
| --- | --- | --- | --- |
| 1 | Manter lint regularizado; acompanhar alertas moderados e checks do GitHub. | Felipe | Lint regularizado; demais ressalvas permanecem registradas em ENTREGA-FASEIV. |
| 2 | Conferir uso em celular físico e preparar vídeo/demonstração controlada. | Felipe; Benedito e Maria usam evidências | Fluxo reproduzível e limitações registradas. |
| 3 | Consolidar documentos, horas reais e cronologia. | Benedito e Maria; Felipe fornece evidências | Documentos e vídeos até 19/11; datas de commit não equivalem a horas trabalhadas. |
| 4 | Apresentar versão e validar definições finais com Leandro. | Felipe | Consultar interesse e viabilidade de piloto antes da entrega. |
| 5 | Piloto real, se viável. | SEMA organiza; Felipe acompanha | Ponto, operador, balança, materiais, armazenamento/destino e divulgação definidos; reservar tempo para correções. |
| 6 | Conferir e entregar Fase IV. | Felipe, Benedito e Maria | Código/instruções acessíveis, evidências, documentos e vídeos; distinguir testes controlados de uso real. |
| 7 | Garantir continuidade do ambiente. | Felipe e mantenedor a definir pela SEMA | Backup externo protegido e solução para o banco antes de 06/12/2026. |

Não há novas datas intermediárias oficiais. Se o piloto não couber antes da entrega, entregar como **sistema preparado para piloto, validado em testes controlados**, com uso real pendente. Não iniciar divulgação antes de confirmar as condições do ponto e o acesso do operador. O piloto precisa de margem para corrigir e retestar.
