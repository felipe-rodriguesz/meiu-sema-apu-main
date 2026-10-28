# MEIU - Gestão de Resíduos Têxteis (SEMA Apucarana)

O **MEIU** (Mapeamento de Resíduos Têxteis) é um sistema desenvolvido para a Secretaria do Meio Ambiente (SEMA) do Município de Apucarana. Seu objetivo é organizar, rastrear e otimizar o fluxo de descarte de resíduos têxteis por meio de um aplicativo voltado para o cidadão/gerador e um painel administrativo para a gestão municipal.

Este repositório é um monorepo contendo três aplicações principais:
1. **MEIU_API:** Backend em NestJS com banco de dados PostgreSQL.
2. **site-frontend:** Painel Administrativo Web (React + Vite) para uso interno da SEMA.
3. **mobile-frontend:** Aplicação Web Mobile-First (React + Vite) para registro de descartes pelos usuários.

---

## 🚀 O que já foi implementado (Fase Atual)

O ecossistema básico de ponta a ponta já está funcional, permitindo que um descarte seja registrado no aplicativo e visualizado no painel de administração.

### 1. API (Backend)
- **Autenticação:** Sistema de login com JWT para administradores da SEMA.
- **Gestão de Pontos de Coleta:** Endpoints para criação, listagem, inativação (soft delete) e exclusão definitiva de pontos (fixos ou rotas).
- **Registro de Descartes:** Endpoint para receber os formulários do aplicativo, gerando um protocolo único e vinculando o descarte ao ponto de coleta escolhido.
- **Estatísticas Básicas:** View no banco de dados para agregar o volume (kg) e os materiais mais comuns.

### 2. Painel SEMA (Web)
- **Acesso Restrito:** Tela de login integrada com a API.
- **Cadastro de Pontos no Mapa:** Interface com mapa interativo (Leaflet + OpenStreetMap) permitindo clicar no mapa para extrair coordenadas geográficas, fazer geocodificação reversa (buscar bairro/endereço) e cadastrar o ponto.
- **Lista de Pedidos de Coleta:** Dashboard para visualizar todos os descartes registrados, com filtros por status, busca em texto livre, e visualização detalhada de cada pedido (incluindo qual ponto de coleta foi selecionado).

### 3. Aplicativo do Gerador (Mobile)
- **Fluxo de Registro (Wizard):** Questionário em 5 etapas para qualificar o resíduo (Mistura, Tipo Principal, Quantidade/Frequência, Detalhes Técnicos, Seleção no Mapa).
- **Geolocalização:** Captura a localização atual do usuário para ordenar os pontos de coleta disponíveis por proximidade.
- **Geração de Protocolo:** Tela de sucesso que exibe o protocolo gerado e salva um histórico local no dispositivo do usuário.

---

## 🚧 Próximos Passos e Débitos Técnicos (Roadmap)

Conforme o projeto evolui, algumas estruturas que foram feitas de forma estática para validar a primeira versão precisarão ser dinamizadas e ajustadas conforme a realidade logística da prefeitura.

### 1. Migração de Dados *Hardcoded* para o Banco de Dados
Atualmente, no frontend mobile, as opções do questionário estão fixas no código (arquivo `opcoesQuestionario.ts`). Nas próximas etapas, essas informações **deverão se tornar tabelas no banco de dados**, permitindo que a SEMA adicione, remova ou edite opções pelo Painel Web sem necessidade de alterar o código do aplicativo. 

Os dados a serem migrados incluem:
* Opções de "Tipo de Resíduo" (Retalho, Apara, Fio residual, etc.)
* Opções de "Composição Principal" (Algodão, Poliéster, etc.)
* Opções de "Estado do Material" (Limpo, Contaminado, etc.)
* Opções de "Tipo de Tecido / Aplicação"

### 2. Refinamento do Questionário (Feedback SEMA)
O modelo atual das perguntas e respostas do aplicativo passará por validação com a Secretaria do Meio Ambiente. 
* As perguntas poderão ser reescritas, agrupadas ou ramificadas dependendo dos feedbacks.
* A nomenclatura técnica será ajustada para garantir que o usuário saiba exatamente o que responder.

### 3. Lógica de Filtro Inteligente no Mapa
Há um débito técnico mapeado na etapa do mapa (`StepMapaColeta.tsx`): atualmente, **todos** os pontos de coleta ativos são exibidos ao usuário. 
* **Futuro:** O mapa deverá filtrar e exibir **apenas** os pontos de coleta que aceitam o tipo de resíduo e a quantidade declarados nas etapas anteriores do questionário.

### 4. Gestão de Fluxo no Painel
Como o objetivo principal do aplicativo móvel é atuar estritamente na **coleta de dados**, o painel administrativo precisará de ferramentas mais robustas para interpretar e gerenciar essas informações:
* **Mapa de Calor (Heatmap):** Implementação de um mapa de calor para visualizar zonas com maior volume ou recorrência de descartes, auxiliando no planejamento logístico.
* **Modelos de Relatórios:** Criação de dashboards avançados e exportação de relatórios para cruzar dados e embasar decisões estratégicas da SEMA.
* **Ações de Gestão:** Implementação das ações de "Editar" e "Excluir" pedidos de coleta diretamente no painel.
* **Esteira de Status:** Criação de um fluxo visual para alterar e acompanhar o status logístico do pedido (Pendente ➔ Em Análise ➔ Aprovado/Concluído).
---