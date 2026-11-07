# MEIU — Resíduos Têxteis / SEMA Apucarana

Projeto de mapeamento da geração de resíduos têxteis e apoio ao recebimento em pontos de coleta supervisionados.

Este repositório privado preserva os fontes e o histórico recebidos pelo GitLab. O desenvolvimento da Fase IV ocorre no GitHub.

- [Plano da Fase IV](DESENVOLVIMENTO.md)
- [Execução, operação e manutenção](docs/OPERACAO.md)
- [Publicação no Render gratuito](docs/RENDER.md)
- [Verificação da versão consolidada](docs/ENTREGA-FASEIV.md)
- [Integração entre Felipe e José](docs/INTEGRACAO-FASEIV.md)
- [Implementação e verificações da frente de Felipe](docs/ENTREGA-FELIPE.md)

## Componentes

| Pasta | Aplicação |
| --- | --- |
| MEIU_API | API NestJS e migrações PostgreSQL |
| site-frontend | Painel SEMA em React |
| mobile-frontend | Formulário público em React |
| MEIU_BANCO | Referência SQL para instalação limpa |

## Executar localmente

Copie .env.example para .env, gere/preencha os segredos e execute:

```sh
docker compose up -d --build
```

Formulário: http://localhost:8080/
Painel: http://localhost:8080/admin/

Crie a conta administrativa conforme [OPERAÇÃO](docs/OPERACAO.md). Não há senha padrão. Banco e configurações locais não devem ser enviados ao Git.

## Estado da implementação

Já estão disponíveis: login, pontos de coleta, formulário, protocolo, consulta administrativa protegida, pesos decimais, recebimento autenticado, correção de peso com histórico, migrações e estrutura de execução/backup.

Também estão implementados formulário com localização opcional, configuração operacional dos pontos, QR Code, relatórios com filtros/CSV e proteções de sessão. Felipe consolidou essa versão, sem outra implementação pendente de integração. As estatísticas antigas somam **peso declarado**, não recebimentos.

O escopo e a ordem de execução seguem DESENVOLVIMENTO.md. A imagem para o Render gratuito foi testada com dados fictícios. Uso real e validação operacional com a SEMA permanecem pendentes. A hospedagem gratuita é temporária; observe os limites e a expiração do banco descritos em RENDER.md.
