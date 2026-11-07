# Entrega da frente de Felipe — Fase IV

Verificação em 29/10/2026, com dados fictícios. Esta entrega prepara a integração técnica; não representa piloto com usuários reais nem conclusão das funcionalidades atribuídas a José.

## Implementado

- Autenticação obrigatória por padrão na API, com rotas públicas explícitas.
- Consulta administrativa de pontos separada da listagem pública de pontos ativos.
- Sessão expirada retorna ao login preservando o protocolo aberto.
- Pesos decimais, frequência inteira positiva, ponto ativo obrigatório e validações de entrada.
- Exclusão de ponto vinculado retorna conflito e preserva dados.
- Migrações para banco vazio ou estrutura anterior, sem apagar registros.
- Recebimento PENDENTE → RECEBIDO com peso aferido, data e operador.
- Proteção transacional contra confirmação duplicada e correção concorrente.
- Correção de peso com justificativa, versão e histórico; peso declarado preservado.
- Busca manual e abertura do painel por link de protocolo, pronta para o QR Code de José.
- Docker Compose com API, formulário, painel, banco persistente e migrações.
- Criação administrativa de operador sem senha padrão, configuração HTTPS e scripts de backup/restauração.

## Verificações realizadas

| Verificação | Resultado |
| --- | --- |
| API com PostgreSQL 16 real | 14 testes aprovados; inclui configuração, migrações, autenticação, validações e concorrência. |
| Banco existente | Peso/protocolo anteriores preservados; dado inválido impede migração sem exclusão. |
| Banco novo | Instalação das três migrações e mesmas colunas do banco atualizado. |
| Recebimento concorrente | Duas confirmações simultâneas: uma aceita, outra 409; 10 kg declarados e 8,7 kg recebidos. |
| Correção concorrente | Uma alteração aceita; outra versão recusada; original, autor e justificativa preservados. |
| Navegador Edge | 2 cenários aprovados, em 1365 px e 390 px: login pelo link, recebimento, correção, recarga, expiração de sessão e busca manual. |
| Compilação | API, painel e formulário compilados; painel também passou na checagem TypeScript. |
| Docker | Instalação/reconstrução e migração executadas; API/painel/formulário acessíveis localmente. |
| Persistência | Reinício da API e do PostgreSQL preservou pedidos, pesos e eventos. |
| Backup | pg_dump custom restaurado em banco separado; na conferência inicial, 2 pedidos, 20 kg declarados, 17,2 kg recebidos e 4 eventos coincidiram com a origem. |

Screenshots dos testes e backups ficam em .local, ignorada pelo Git. Os testes E2E criam novos dados fictícios a cada execução; por isso os totais atuais podem ser maiores que os da conferência inicial.

## Dependências e manutenção

Foram corrigidos os alertas altos/críticos encontrados nas dependências de produção, mantendo NestJS 10. TypeORM e componentes transitivos receberam versões compatíveis; o painel recebeu Axios atualizado.

Auditoria npm --omit=dev em 29/10/2026:
- API: zero críticos/altos; seis alertas moderados, relacionados a dois componentes e seus dependentes.
- Painel: zero alertas.
- Formulário: zero alertas.

Pendências moderadas: [NestJS/SSE](https://github.com/advisories/GHSA-36xv-jgw5-4q75) e [file-type/ASF](https://github.com/advisories/GHSA-5v7r-6r5c-r473), [file-type/ZIP](https://github.com/advisories/GHSA-j47w-4g3g-c36v). A aplicação conferida não expõe SSE nem upload/inspeção de arquivos. Uma atualização principal do Nest deve ser planejada separadamente; reavaliar esses alertas antes de adicionar tais recursos. Auditoria sem alertas altos não equivale a garantia de ausência de vulnerabilidades.

## O que depende da próxima etapa

**José:** formulário/localização, informações operacionais e edição dos pontos, QR Code, relatórios e CSV. Os contratos estão em [INTEGRAÇÃO](INTEGRACAO-FASEIV.md). A lista de pedidos já distingue os pesos, mas não substitui os relatórios planejados.

**Hospedagem:** definir servidor, domínio, mantenedor e acessos; publicar e verificar HTTPS/celular no ambiente escolhido. A configuração foi preparada; nenhum domínio público foi provisionado.

**Equipe:** revisão cruzada, integração e testes completos após as entregas de José. Benedito e Maria podem usar as evidências para documentação/vídeos e registrar as horas efetivamente trabalhadas, sem estimativas inventadas.

**Leandro:** demonstração e eventual piloto depois da versão integrada e estável, se houver tempo e disponibilidade. Nenhuma mensagem foi enviada em nome da equipe.

## Conferência sugerida para Felipe

1. Abra o painel local, entre com a conta fictícia e selecione Pedidos de coleta.
2. Consulte um protocolo recebido e confira pesos, operador e histórico.
3. Registre um novo pedido de teste, receba-o e tente repetir a confirmação.
4. Confira a proposta de código na branch de revisão antes da integração à main.
5. Compartilhe INTEGRACAO-FASEIV.md com José para orientar as próximas entregas.
