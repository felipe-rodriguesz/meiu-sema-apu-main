param([string]$EnvFile = '.env')
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
    $name = "meiu-$stamp.dump"
    $folder = Join-Path (Get-Location) '.local/backups'
    [IO.Directory]::CreateDirectory($folder) | Out-Null
    & docker compose --env-file $EnvFile exec -T db pg_dump -U meiu -d meiu -Fc -f "/tmp/$name"
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar backup.' }
    $target = Join-Path $folder $name
    & docker compose --env-file $EnvFile cp "db:/tmp/$name" $target
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao copiar backup.' }
    [PSCustomObject]@{ Arquivo = $target; Bytes = (Get-Item -LiteralPath $target).Length; SHA256 = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash }
} finally { Pop-Location }
