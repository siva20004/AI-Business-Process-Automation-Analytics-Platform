@echo off
setlocal enabledelayedexpansion

echo ===============================================================================
echo   FUJI FLOW - Platform Shutdown Controller (Windows)
echo ===============================================================================
echo.

cd /d "%~dp0"

echo Stopping FUJI FLOW services...

:: Use PowerShell to safely identify and terminate only the processes bound to ports 8000 (Backend) and 5173 (Frontend)
powershell -NoProfile -ExecutionPolicy Bypass -Command @"
\$ports = @(8000, 5173)
foreach (\$port in \$ports) {
    try {
        \$connections = Get-NetTCPConnection -LocalPort \$port -State Listen -ErrorAction SilentlyContinue
        if (\$connections) {
            foreach (\$conn in \$connections) {
                \$procId = \$conn.OwningProcess
                if (\$procId -and \$procId -gt 4) {
                    \$proc = Get-Process -Id \$procId -ErrorAction SilentlyContinue
                    if (\$proc) {
                        Write-Host "  Terminating process \$procId (\$(\$proc.ProcessName)) bound to port \$port..."
                        Stop-Process -Id \$procId -Force -ErrorAction SilentlyContinue
                    }
                }
            }
        } else {
            Write-Host "  Port \$port is clean (no active listener)."
        }
    } catch {
        Write-Host "  Port \$port check completed."
    }
}
"@

echo.
echo FUJI FLOW processes have been safely terminated.
echo.
