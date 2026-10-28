# MEIU API - Gestão de Resíduos Têteis

Esta é a API Backend para o projeto MEIU de Apucarana. Desenvolvida em **NestJS**, ela fornece os endpoints necessários para registro de descartes, visualização de estatísticas e gestão administrativa.

## Pré-requisitos

- Node.js (v18+)
- npm ou yarn

## Usuário administrador padrão para testes

Para acessar o painel administrativo, é necessário existir um usuário na tabela `admin_sema`.

Após criar as tabelas do banco, execute o SQL abaixo no PostgreSQL ou no Query Tool do pgAdmin:

```sql
INSERT INTO admin_sema (
  nome,
  email,
  senha_hash
)
VALUES (
  'Administrador SEMA',
  'admin@admin-sema.com',
  crypt('admin123', gen_salt('bf', 10))
);

## Instalação

```bash
cd MEIU_API
npm install
```

## Execução com Docker/Podman (Recomendado)

Para simular o ambiente real (incluindo o banco de dados Postgres/Neon), utilize o Compose:

```bash
# Na raiz do projeto
podman-compose up --build
```

Isso irá:
1. Subir um banco de dados PostgreSQL (container `meiu_db_test`).
2. Inicializar o banco com o schema `001_initial_schema.sql`.
3. Compilar e rodar a API NestJS conectada a este banco.

---

## Execução Local

```bash
# Modo de desenvolvimento
npm run start:dev

# Modo de produção
npm run build
npm run start:prod
```

## Documentação da API

Uma vez que a aplicação estiver rodando, você pode acessar a documentação interativa (Swagger) em:
[http://localhost:3001/api/docs](http://localhost:3001/api/docs)

## Execução com Docker (Standalone)

Esta API pode ser buildada e executada de forma independente:

```bash
# Build da imagem
podman build -t meiu-api .

# Execução (conectando a um banco externo/Neon)
podman run -p 3001:3001 -e DATABASE_URL="sua_url_neon_aqui" meiu-api
```

---

## Estrutura de Módulos

- **Descartes:** Gerenciamento do fluxo de registro de resíduos (Wizard).
- **Stats:** Agregação de dados para o painel de impacto.
- **Auth:** Segurança para acesso administrativo da SEMA.
- **Noticias:** Conteúdo para a "Vitrine Social" e comunicados.
