# MEIU — Resíduos Têxteis / SEMA Apucarana

Sistema web para registrar resíduos têxteis, orientar a entrega em pontos supervisionados e permitir à SEMA acompanhar recebimentos e relatórios. O formulário não exige nome, CPF ou CNPJ. Registros não equivalem a pessoas únicas, e recebimento não comprova destinação posterior.

- [Formulário publicado](https://meiu-sema-apucarana.onrender.com/)
- [Painel SEMA — exige login](https://meiu-sema-apucarana.onrender.com/admin/)
- [Escopo e próximos passos da Fase IV](DESENVOLVIMENTO.md)
- [Como executar, operar, testar e manter](docs/OPERACAO.md)
- [Arquitetura e contratos da API](docs/API.md)
- [Hospedagem, backup e limites gratuitos](docs/RENDER.md)
- [Verificação, segurança e cronologia da entrega](docs/ENTREGA-FASEIV.md)

## Funcionamento atual

A SEMA configura ponto, dias/horários, materiais, limite por pedido e orientações. O gerador registra o resíduo e recebe protocolo/QR. O operador autenticado confere o material e registra o peso aferido, mantendo o declarado. Correções exigem justificativa e ficam no histórico. Relatórios oferecem filtros, totais separados e CSV para Excel.

Felipe consolidou a implementação da Fase IV sobre o sistema das fases anteriores. Não há código de José pendente de integração. O mínimo funcional passou em testes controlados; piloto real e teste em celular físico permanecem pendentes. O Render gratuito é temporário e o banco expira em **06/12/2026**. Não divulgar como operação municipal permanente.

## Componentes

| Pasta | Responsabilidade |
| --- | --- |
| MEIU_API | API NestJS, regras de negócio e migrações PostgreSQL. |
| site-frontend | Painel administrativo React. |
| mobile-frontend | Formulário React responsivo; não é aplicativo nativo. |
| MEIU_BANCO | Referência SQL legada; instalar/atualizar com migrações. |
| deploy e scripts | Publicação e backup/restauração. |

## Iniciar localmente

Requer Docker com Compose. Copie `.env.example` para `.env`, gere dois segredos aleatórios distintos para banco e JWT e preencha os campos conforme [OPERAÇÃO](docs/OPERACAO.md). Execute:

```sh
docker compose up -d --build
```

Formulário: http://localhost:8080/ — Painel: http://localhost:8080/admin/.
Crie o operador conforme OPERAÇÃO; não existe senha padrão. Nunca envie `.env`, backups ou credenciais ao Git.

## Repositório e continuidade

O desenvolvimento acontece neste GitHub privado; a origem e o histórico do GitLab foram preservados. Uma futura entrega ao GitLab deve ser coordenada com a orientadora. Novas equipes devem começar por OPERAÇÃO e API, usar branches/pull requests e manter as limitações em ENTREGA-FASEIV atualizadas. Registros intermediários removidos da documentação atual permanecem recuperáveis pelo histórico Git.
