param(
    [Parameter(Mandatory=$true)][string]$Backup,
    [string]$Database = ('meiu_restore_' + (Get-Date -Format 'yyyyMMdd_HHmmss')),
    [string]$EnvFile = '.env'
)
$ErrorActionPreference = 'Stop'
if ($Database -notmatch '^meiu_restore_[a-zA-Z0-9_]+$') { throw 'Use um banco novo com prefixo meiu_restore_.' }
$source = (Resolve-Path -LiteralPath $Backup).Path
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    $remote = "/tmp/$Database.dump"
    & docker compose --env-file $EnvFile cp $source "db:$remote"
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao copiar arquivo.' }
    & docker compose --env-file $EnvFile exec -T db createdb -U meiu $Database
    if ($LASTEXITCODE -ne 0) { throw 'Banco já existe ou não pôde ser criado. Nenhum banco existente será sobrescrito.' }
    & docker compose --env-file $EnvFile exec -T db pg_restore -U meiu -d $Database --no-owner --exit-on-error $remote
    if ($LASTEXITCODE -ne 0) { throw "Restauração falhou; examine o banco isolado $Database antes de utilizá-lo." }
    & docker compose --env-file $EnvFile exec -T db psql -U meiu -d $Database -v ON_ERROR_STOP=1 -c 'SELECT count(*) AS pedidos, sum(quantidade_kg) AS kg_declarados, sum(peso_recebido_kg) AS kg_recebidos FROM descarte; SELECT count(*) AS eventos FROM recebimento_historico;'
    if ($LASTEXITCODE -ne 0) { throw 'Falha na conferência.' }
    Write-Output "Backup restaurado para conferência em $Database. O banco meiu permanece intacto."
} finally { Pop-Location }
