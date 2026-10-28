# Mobile Frontend - MEIU / Resíduo Têxtil Apucarana

Frontend mobile-first do projeto **MEIU - Mapeamento de Resíduos Têxteis no Município de Apucarana**.

Este projeto foi desenvolvido com **React + TypeScript + Vite**, com foco em uso mobile pelo navegador. A interface permite:

- exibir aviso de anonimato;
- coletar informações sobre o resíduo têxtil descartado;
- buscar pontos de coleta no backend;
- exibir pontos próximos em mapa com Leaflet;
- selecionar um ponto de coleta;
- gerar pedido de descarte enviando os dados para o backend;
- exibir protocolo retornado pela API.

---

## Tecnologias utilizadas

- React
- TypeScript
- Vite
- Leaflet
- React Leaflet

---

## Pré-requisitos

Antes de rodar o projeto, instale:

- Node.js 18 ou superior;
- npm;
- backend MEIU rodando na porta `3001`;
- banco PostgreSQL configurado para o backend.

O backend esperado deve expor a API em:

```txt
http://localhost:3001/api/v1