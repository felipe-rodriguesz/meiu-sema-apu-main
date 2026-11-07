# Implementação consolidada da Fase IV

Atualização em 06/11/2026: Felipe confirmou a consolidação desta implementação como versão da equipe, sem outra implementação de José a integrar. A versão inclui os ajustes de interface e segurança posteriores. A publicação foi autorizada no Render gratuito; consulte [RENDER.md](RENDER.md) para operação e limites.

## O que foi implementado

| Frente | Resultado |
| --- | --- |
| Formulário | Peso com ponto/vírgula, até três casas; mensagens da API; frequência válida; localização opcional, sem coordenadas fictícias ou envio da posição do aparelho como origem. |
| Pontos | Horários próprios para cada dia da semana; lista de materiais principais e opções personalizadas por ponto; limite em kg por pedido e orientações. Condições abaixo do mapa/dados básicos, ocupando toda a largura. Informações públicas no formulário e na confirmação. |
| Protocolo/QR | Geração local e download do QR, contendo somente URL do painel e protocolo. Consulta exige autenticação; busca manual permanece disponível. Confirmação não depende de armazenamento local do navegador. |
| Relatórios | API protegida e aba no painel; indicadores, agrupamentos por ponto/resíduo e filtros por período, ponto, resíduo e situação. Pesos declarados e recebidos separados. |
| CSV | Mesma consulta filtrada do relatório; todos os registros, cabeçalho quando vazio, acentos e casas decimais para Excel, proteção contra fórmulas em campos de texto. |
| Integração | Fluxo público → protocolo/QR → login → recebimento → relatório/CSV. Testes de concorrência e correção da frente de Felipe mantidos. |
| Instruções | Contratos em INTEGRACAO-FASEIV.md e operação, implantação e manutenção em OPERACAO.md. |

Dias e horários são condições de entrega, não agenda automática. Registros antecipados são permitidos enquanto o ponto estiver ativo; a SEMA deve desativá-lo ao encerrar. As datas de período foram retiradas da interface. Materiais são conferidos presencialmente. O limite é por pedido, não por pessoa nem por dia.

## Validação reproduzível

Resultado após a revisão das condições de atendimento: **17 testes da API e 15 testes de navegador aprovados**, além de compilação das três aplicações, verificação de tipos do painel e lint do formulário. Antes de aplicar a migração de horários por dia, o backup do banco fictício foi restaurado em banco novo: conteúdos de 10 pontos, 11 pedidos, 15 eventos, 1 operador e 4 migrações coincidiram por contagem e checksum. A quinta migração foi testada em instalação nova e na conversão do formato anterior.

O cadastro revisado foi verificado em 1440, 390 e 320 px, com condições abaixo do mapa/dados básicos e largura completa. Os testes conferem horários diferentes por dia, duração calculada, inclusão/remoção de material personalizado, rejeição de duplicados, persistência após recarregar e exibição pública.

Os campos do painel também foram verificados em 320, 390, 768, 1024, 1365 e 1920 px, com preferências de tema claro e escuro: sem transbordamento da página, mantendo campos claros e contraste legível.

- API: `npm test` em MEIU_API, com TEST_DATABASE_URL local de testes. Verifica instalação nova, preservação de legado, autenticação, limites, edição, recebimento, correções concorrentes, relatórios/CSV e proteção das reversões.
- Painel: `npm run typecheck` e `npm run build` em site-frontend.
- Formulário: `npm run lint` e `npm run build` em mobile-frontend.
- Navegador: `npm run test:e2e` em site-frontend, com E2E_EMAIL e E2E_PASSWORD de operador fictício. A instância padrão é localhost:8080; apenas endereços locais são aceitos.
- Evidências locais: .local/playwright e .local/BACKUP-VERIFICADO-JOSE.json, fora do versionamento. Há capturas do protocolo e dos relatórios nas larguras de 1365 e 390 px no Edge; não foi realizado teste em aparelho físico.
- Dados fictícios permanecem separados dos dados reais. Os testes não representam atendimento real com a SEMA.

Os testes do CSV incluem pesos decimais, período inclusivo, mudança de dia em America/Sao_Paulo, situação/resíduo/ponto combinados, resultados vazios e texto com aspas, ponto e vírgula, quebra de linha e tentativa de fórmula. Correções não duplicam o peso recebido.

## Demonstração controlada

1. Cadastre um ponto explicitamente fictício, com endereço e coordenadas de demonstração. Informe dias, horários, materiais, limite de pelo menos 10 kg e orientações.
2. No formulário público, registre 10 kg de retalho de corte e selecione esse ponto. Negar localização deve permitir continuar.
3. Guarde o protocolo e baixe o QR. Abra seu link no painel; sem sessão, deve pedir login e depois abrir o pedido.
4. Confira o material e registre 8,7 kg recebidos. O peso declarado deve continuar 10 kg; uma segunda confirmação não pode criar outro recebimento.
5. Em Relatórios, filtre pelo ponto: 1 registro, 1 recebido, 0 pendentes, 10 kg declarados e 8,7 kg recebidos. Exporte o CSV e compare.
6. Se testar uma correção para 8,6 kg, exija motivo e confira o histórico. O relatório deve mostrar 8,6 kg recebidos e continuar com apenas 1 recebimento.
7. Filtre PENDENTE nesse ponto sem outros pedidos: totais zero e CSV somente com cabeçalho.

## Manutenção das migrações

As migrações 1793232003000/1793232004000 integram esta versão. Não reexecute mudanças equivalentes nem edite migrações já aplicadas; novas mudanças de estrutura precisam de nova migração.

Preserve também os ajustes locais anteriores de tema claro, responsividade e geocodificação do bairro. Nenhuma funcionalidade de notícias ou melhoria adicional foi incluída.

## Limites e pendências externas

- Hospedagem escolhida: Render gratuito, com endereço onrender.com e HTTPS gerenciado. O banco gratuito expira após 30 dias e exige exportação antes do prazo; não é uma solução permanente de operação municipal.
- Ponto real, atendimento, balança, armazenamento, destino e divulgação dependem da SEMA. Não houve piloto real.
- O QR usa VITE_PAINEL_URL, definido ao compilar. No Compose usa /admin/ no mesmo domínio; em interfaces separadas, configurar a URL HTTPS do painel e reconstruir.
- Datas de criação legadas não têm fuso; o relatório preserva o calendário gravado. Recebimentos usam America/Sao_Paulo.
- Tela e CSV consultam o banco em solicitações distintas. Atualize a tela antes de comparar se ocorrerem novos atendimentos entre as consultas.
- Não foi realizado teste de carga ou homologação em infraestrutura pública.
- O primeiro teste usou ambiente alternativo local. O Docker voltou a funcionar e a imagem Dockerfile.render foi compilada em 06/11/2026; a homologação usa banco separado dos ambientes anteriores.
