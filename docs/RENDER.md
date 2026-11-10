# Publicação e manutenção no Render gratuito

Configuração: `render.yaml` e `Dockerfile.render`. O mesmo serviço publica formulário em `/`, painel em `/admin/` e API em `/api/v1`. PostgreSQL fica em serviço separado. O domínio `onrender.com` oferece HTTPS gerenciado, sem contratar domínio próprio.

## Implantação

1. Conecte o repositório privado da equipe ao Render e selecione a versão consolidada na branch `main`.
2. Crie um Blueprint usando `render.yaml`; confirme plano **Free** para web e banco, sem adicionar recursos pagos.
3. O Render gera JWT_SECRET e conecta DATABASE_URL ao banco interno. A origem permitida vem de RENDER_EXTERNAL_URL. Caso adicione domínio próprio, configure CORS_ORIGINS com as origens HTTPS exatas.
4. As migrações são aplicadas no início, antes de abrir o servidor. Falha de migração interrompe a inicialização. Não use synchronize=true.
5. Cadastre o primeiro operador com `MEIU_API/scripts/create-admin.cjs` a partir de uma máquina autorizada, usando a conexão externa e TLS verificado. Não existe senha padrão nem cadastro administrativo público.
6. Confirme formulário, login, protocolo/QR, recebimento, relatórios/CSV, cabeçalhos de segurança e backup. Mantenha pontos fictícios desativados fora da demonstração.

Não são necessários acesso SSH ao serviço, armazenamento local persistente ou tarefas pagas. O servidor é executado como usuário sem privilégios e a imagem contém somente as dependências de produção e as compilações.

## Limites e continuidade

- O serviço gratuito adormece após 15 minutos sem acesso; a primeira abertura pode levar aproximadamente um minuto.
- O PostgreSQL gratuito tem 1 GB e **expira 30 dias após sua criação**. O Render não oferece backup gerenciado nesse plano. Exporte os dados antes da expiração; mantenha também uma cópia antes de atualizar a aplicação e após cada dia de atendimento.
- A franquia gratuita de horas e tráfego é compartilhada com outros serviços da conta. Acompanhe o consumo e mantenha gasto adicional bloqueado nas configurações de cobrança, quando disponível.
- Esta implantação atende demonstração e piloto supervisionado. Continuidade após a expiração depende de migração para um banco persistente adequado ou contratação posterior, sujeita à decisão da equipe/SEMA.
- Felipe coordena a conta e os acessos durante esta entrega. A SEMA precisa indicar o responsável pela manutenção para operação contínua.

Fonte: [limites oficiais do Render](https://render.com/docs/free).

## Backup fora do Render

Em máquina com Docker, disponibilize a URL **externa** do banco apenas na variável de ambiente DATABASE_URL da sessão, sem registrá-la no Git ou compartilhar em mensagens. Libere no Render somente o IP da máquina usada para manutenção. Execute na raiz:

```powershell
./scripts/Backup-Remote.ps1
```

O comando usa PostgreSQL 16, exige TLS com verificação do certificado e grava um arquivo `.dump` em `.local/backups`, ignorado pelo Git. Retire DATABASE_URL da sessão ao terminar. Guarde uma segunda cópia em armazenamento externo privado da equipe.

Para conferir a recuperação, restaure o arquivo em um banco local novo com `scripts/Restore-Backup.ps1`. O script usa o usuário local como proprietário, ignora permissões específicas do provedor e recusa sobrescrever bancos existentes. Compare pedidos, pesos e histórico com a origem. O CSV dos relatórios não substitui o backup do banco.

## Segurança e atualização

O workflow do GitHub está configurado para compilar as três aplicações, executar a suíte da API e verificar dependências de produção. Em 06/11/2026, o GitHub bloqueou sua execução por restrição de cobrança/limite da conta, antes de iniciar qualquer job. As verificações da entrega foram executadas localmente. O Render usa **deploy manual**: valide a versão antes de acionar uma nova publicação. Após regularizar a execução dos checks, pode-se mudar autoDeployTrigger para checksPass. As credenciais ficam nas variáveis do Render, nunca no repositório.

Em 06/11/2026, a auditoria da API identificou nove avisos moderados e nenhum alto/crítico. Os avisos envolvem NestJS/SSE, inspeção de arquivos (`file-type`) e padrões de arquivos (`glob`/`minimatch`). A aplicação atual não expõe SSE nem upload/inspeção de arquivos e utiliza classes de entidades/migrações definidas no código, sem padrões fornecidos por usuários. Isso reduz a exposição dos caminhos afetados, mas não elimina os avisos. Uma atualização principal deve ser validada antes de introduzir esses recursos. Não usar `npm audit fix --force` diretamente no ambiente publicado.

Reinícios não apagam o PostgreSQL, mas reiniciam os contadores de limite de requisições. A configuração atual contempla uma instância da API; múltiplas instâncias exigem limites compartilhados.

## Estado confirmado em 09/11/2026

Serviço Live em `6a9c463`, banco disponível e acesso externo bloqueado. Expiração exibida: **06/12/2026**. A main `ac62dbc` acrescentava somente documentação e ajuste do script local de restauração; não exigia recompilar a aplicação. A revisão documental de 09/11 também não altera a aplicação publicada.

A conexão interna usa `DATABASE_SSL=false` no Blueprint; não confundir rede privada com TLS. Manutenção externa exige verificação de certificado. O plano atual não é hospedagem permanente. A configuração de cobrança adicional/alertas personalizados ainda precisa de confirmação; recursos Free não demonstram por si só um teto de gastos da conta.

Atualização posterior em 09/11/2026: commit `7820332` publicado manualmente com sucesso (Live), incluindo a regularização de lint. Acesso público, login e relatórios/CSV conferidos após a publicação. Nenhum pedido de teste foi criado em produção.
