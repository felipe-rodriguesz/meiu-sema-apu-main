param([string]$OutputDirectory = (Join-Path $PSScriptRoot '../.local/backups'))
$ErrorActionPreference = 'Stop'
if (-not $env:DATABASE_URL) { throw 'Configure DATABASE_URL na sessão com o endereço externo do banco. Não inclua credenciais em comandos ou arquivos versionados.' }
$uri = [Uri]$env:DATABASE_URL
if ($uri.Scheme -notin @('postgres', 'postgresql')) { throw 'DATABASE_URL deve ser PostgreSQL.' }
$credentials = $uri.UserInfo.Split(':', 2)
if ($credentials.Count -ne 2) { throw 'A URL deve conter usuário e senha.' }
$names = @('PGHOST','PGPORT','PGDATABASE','PGUSER','PGPASSWORD','PGSSLMODE','PGSSLROOTCERT')
$previous = @{}
foreach ($name in $names) { $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
try {
    $env:PGHOST = $uri.Host
    $env:PGPORT = if ($uri.Port -gt 0) { [string]$uri.Port } else { '5432' }
    $env:PGDATABASE = [Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart('/'))
    $env:PGUSER = [Uri]::UnescapeDataString($credentials[0])
    $env:PGPASSWORD = [Uri]::UnescapeDataString($credentials[1])
    $env:PGSSLMODE = 'verify-full'
    $env:PGSSLROOTCERT = 'system'
    $directory = [IO.Directory]::CreateDirectory([IO.Path]::GetFullPath($OutputDirectory)).FullName
    $file = 'meiu-remote-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.dump'
    & docker run --rm --mount "type=bind,source=$directory,target=/backup" -e PGHOST -e PGPORT -e PGDATABASE -e PGUSER -e PGPASSWORD -e PGSSLMODE -e PGSSLROOTCERT postgres:16-alpine pg_dump --format=custom --no-owner --file "/backup/$file"
    if ($LASTEXITCODE -ne 0) { throw 'Falha no backup remoto. Confira conexão, certificado e permissão de acesso do seu IP.' }
    $target = Join-Path $directory $file
    [PSCustomObject]@{ Arquivo = $target; Bytes = (Get-Item -LiteralPath $target).Length; SHA256 = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash }
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
}
