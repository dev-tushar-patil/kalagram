# Stops the Kalagram website, API and database that start-local started.
# Only touches ports 5180, 8080 and 3307. The MySQL service on port 3306 and other projects are left alone.

param(
    [string]$ToolsDir = "$env:USERPROFILE\.expense-tracker-tools",
    [int]$MySqlPort = 3307
)

function Test-Port($port) {
    return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

foreach ($port in 5180, 8080) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Shut MySQL down cleanly rather than killing it, so it never has to recover its data.
if (Test-Port $MySqlPort) {
    $admin = Get-ChildItem "$ToolsDir\mysql\mysql-8*\bin\mysqladmin.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($admin) {
        & $admin.FullName -h 127.0.0.1 -P $MySqlPort -u root shutdown
    } else {
        Write-Host "mysqladmin was not found under $ToolsDir." -ForegroundColor Red
    }
}

$deadline = (Get-Date).AddSeconds(90)
$ports = 5180, 8080, $MySqlPort
while ((@($ports | Where-Object { Test-Port $_ }).Count -gt 0) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2
}

$left = @($ports | Where-Object { Test-Port $_ })
if ($left.Count -gt 0) {
    Write-Host "Could not stop everything. Still running on port(s): $($left -join ', ')" -ForegroundColor Red
    exit 1
}
Write-Host 'Kalagram has stopped.'
