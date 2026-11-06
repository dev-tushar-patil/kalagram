# Starts Kalagram on this PC: MySQL 8 on port 3307, the API on 8080 and the website on 5180.
# It does not use or change the MySQL service on port 3306, which is version 5.5 and too old for this project.
# First run: creates a private database folder and kalagram-backend\.env with random secrets.
# Run again any time; whatever is already running is left alone.

param(
    [string]$ToolsDir = "$env:USERPROFILE\.expense-tracker-tools",
    [string]$DataDir = "$env:USERPROFILE\.kalagram\mysql-data",
    [int]$MySqlPort = 3307,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$backend = Join-Path $root 'kalagram-backend'
$frontend = Join-Path $root 'kalagram-frontend'
$logs = Join-Path $root 'logs'
New-Item -ItemType Directory -Force $logs | Out-Null

function Find-Tool($pattern, $label) {
    $hit = Get-ChildItem $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $hit) { throw "$label not found at $pattern. Pass -ToolsDir, or see README.md for manual setup." }
    return $hit.FullName
}

function Test-Port($port) {
    # Ask Windows rather than connecting: Vite listens only on IPv6 (::1) and MySQL only on IPv4.
    return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

function Wait-Port($port, $label, $seconds) {
    $deadline = (Get-Date).AddSeconds($seconds)
    while (-not (Test-Port $port)) {
        if ((Get-Date) -gt $deadline) { throw "$label did not start within $seconds seconds." }
        Start-Sleep -Seconds 2
    }
}

# Keeps the previous run's log as <name>.previous.log, then returns the paths for this run.
function New-LogPaths($name) {
    foreach ($suffix in '', '-errors') {
        $current = Join-Path $logs "$name$suffix.log"
        if (Test-Path $current) { Move-Item $current (Join-Path $logs "$name$suffix.previous.log") -Force }
    }
    return @{ RedirectStandardOutput = (Join-Path $logs "$name.log"); RedirectStandardError = (Join-Path $logs "$name-errors.log") }
}

function New-Secret($bytes) {
    $data = New-Object byte[] $bytes
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($data)
    return ([Convert]::ToBase64String($data) -replace '[+/=]', 'x')
}

$jdk = Find-Tool "$ToolsDir\jdk\jdk-21*" 'JDK 21'
$mysqld = Join-Path (Find-Tool "$ToolsDir\mysql\mysql-8*" 'MySQL 8') 'bin\mysqld.exe'
$maven = Join-Path (Find-Tool "$ToolsDir\maven\apache-maven-*" 'Maven') 'bin\mvn.cmd'
$env:JAVA_HOME = $jdk
$env:PATH = "$jdk\bin;$env:PATH"

# ---- Database -------------------------------------------------------------------------------
if (-not (Test-Path (Join-Path $DataDir 'mysql'))) {
    Write-Host 'Creating the Kalagram database folder (first run only)...'
    New-Item -ItemType Directory -Force (Split-Path $DataDir) | Out-Null
    # Root has no password, but the server only ever listens on 127.0.0.1 (below).
    $init = Start-Process $mysqld -ArgumentList '--no-defaults', '--initialize-insecure', "--datadir=`"$DataDir`"" -Wait -PassThru -NoNewWindow
    if ($init.ExitCode -ne 0) { throw 'MySQL could not initialise its data folder.' }
}
if (-not (Test-Port $MySqlPort)) {
    Write-Host "Starting MySQL on port $MySqlPort..."
    Start-Process $mysqld -WindowStyle Hidden -ArgumentList '--no-defaults', "--datadir=`"$DataDir`"", "--port=$MySqlPort", '--bind-address=127.0.0.1', '--mysqlx=OFF', '--skip-log-bin'
    Wait-Port $MySqlPort 'MySQL' 120
}

# ---- Backend configuration ------------------------------------------------------------------
$envFile = Join-Path $backend '.env'
if (-not (Test-Path $envFile)) {
    $adminPassword = New-Secret 12
    @(
        "DB_URL=jdbc:mysql://127.0.0.1:$MySqlPort/kalagram?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=utf8&serverTimezone=UTC&allowPublicKeyRetrieval=true&useSSL=false"
        'DB_USERNAME=root'
        'DB_PASSWORD='
        "JWT_SECRET=$(New-Secret 48)"
        'ADMIN_EMAIL=admin@kalagram.org'
        "ADMIN_PASSWORD=$adminPassword"
    ) | Set-Content -Path $envFile -Encoding ascii
    Write-Host ''
    Write-Host "Admin login created. Email: admin@kalagram.org  Password: $adminPassword" -ForegroundColor Yellow
    Write-Host "(Also saved in $envFile)" -ForegroundColor Yellow
    Write-Host ''
}

# ---- Backend --------------------------------------------------------------------------------
$jar = Join-Path $backend 'target\kalagram-backend-1.0.0.jar'
$newestSource = Get-ChildItem (Join-Path $backend 'src'), (Join-Path $backend 'pom.xml') -Recurse -File |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not (Test-Port 8080)) {
    if (-not (Test-Path $jar) -or (Get-Item $jar).LastWriteTime -lt $newestSource.LastWriteTime) {
        Write-Host 'Building the backend (this can take several minutes)...'
        Push-Location $backend
        try {
            & $maven -q -B -DskipTests package
            if ($LASTEXITCODE -ne 0) { throw 'The backend build failed.' }
        } finally { Pop-Location }
    }
    Write-Host 'Starting the API on port 8080...'
    $backendLogs = New-LogPaths 'backend'
    Start-Process (Join-Path $jdk 'bin\java.exe') -WorkingDirectory $backend -ArgumentList '-Xmx400m', '-jar', "`"$jar`"" -WindowStyle Hidden @backendLogs
    Write-Host 'This can take several minutes on a busy PC. Please wait...'
    Wait-Port 8080 'The API' 600
}

# ---- Frontend -------------------------------------------------------------------------------
if (-not (Test-Port 5180)) {
    if (-not (Test-Path (Join-Path $frontend 'node_modules'))) {
        Write-Host 'Installing website packages...'
        Push-Location $frontend
        try {
            & npm.cmd install --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }
        } finally { Pop-Location }
    }
    Write-Host 'Starting the website on port 5180...'
    $websiteLogs = New-LogPaths 'website'
    Start-Process 'npm.cmd' -WorkingDirectory $frontend -ArgumentList 'run', 'dev' -WindowStyle Hidden @websiteLogs
    Wait-Port 5180 'The website' 90
}

Write-Host ''
Write-Host 'Kalagram is running.' -ForegroundColor Green
Write-Host '  Website: http://localhost:5180'
Write-Host '  Admin:   http://localhost:5180/admin  (login is in kalagram-backend\.env)'
Write-Host "  Logs:    $logs"
Write-Host '  To stop: double-click stop-local.cmd'
if (-not $NoBrowser) { Start-Process 'http://localhost:5180' }
