## Como Executar o Frontend

Este projeto foi desenvolvido utilizando **React + TypeScript** e utiliza o **Vite** como empacotador rápido de desenvolvimento. O mapa interativo foi implementado utilizando bibliotecas open source (**Leaflet** e **OpenStreetMap**).

### Pré-requisitos
Antes de começar, certifique-se de ter instalado em sua máquina:
* **Node.js** (Versão 18 ou superior recomendada)
* **npm** (Já vem instalado junto com o Node)
* O **Backend (NestJS)** rodando

---

### Passo a Passo para Inicialização

#### 1. Instalar as Dependências do Projeto
Navegue até a pasta raiz deste frontend pelo terminal e instale os pacotes necessários:
```bash
npm install

```

#### 2. Configurar as Variáveis de Ambiente (`.env`)

Certifique-se de que existe um arquivo na raiz do frontend chamado `.env` apontando para o nosso servidor NestJS local. O conteúdo deve ser:

```env
VITE_API_URL=http://localhost:3001/api/v1

```

#### 3. Iniciar o Servidor de Desenvolvimento

Com as dependências instaladas e o `.env` configurado, ligue o motor do Vite rodando:

```bash
npm run dev

```

---

### Acessando o Painel

Após rodar o comando acima, o Vite disponibilizará o endereço local no seu terminal. Basta abrir o seu navegador e acessar: