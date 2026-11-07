# API MEIU

NestJS, TypeORM e PostgreSQL. Prefixo: /api/v1.

Consulte [execução e manutenção](../docs/OPERACAO.md), [contrato de integração](../docs/INTEGRACAO-FASEIV.md) e [plano da fase](../DESENVOLVIMENTO.md).

## Comandos

- npm ci
- npm run build
- npm run migration:show
- npm run migration:run
- npm run start:dev
- npm run start:prod
- npm run admin:create
- npm test

Copie .env.example para .env e configure as variáveis antes de executar a API. JWT_SECRET e CORS_ORIGINS são obrigatórios. O banco remoto deve usar TLS com validação de certificado. A estrutura é atualizada por migrações; synchronize permanece desabilitado.

Swagger: /api/docs, somente em desenvolvimento. Consultas e operações administrativas exigem JWT; apenas rotas explicitamente públicas dispensam login.
