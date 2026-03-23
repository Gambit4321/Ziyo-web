param(
    [int]$DelaySeconds = 8,
    [switch]$RestartCodex = $true,
    [switch]$PreferGitCanonicalRoots
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[run-codex-sidebar-repair-detached] $Message"
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repairScript = Join-Path $scriptRoot "repair_codex_chat_index.ps1"

if (-not (Test-Path -LiteralPath $repairScript)) {
    throw "Repair script not found: $repairScript"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $env:TEMP "codex-sidebar-repair-$timestamp.log"

Write-Step "Log file: $logPath"
Start-Transcript -Path $logPath -Force | Out-Null

try {
    if ($DelaySeconds -gt 0) {
        Write-Step "Waiting $DelaySeconds second(s) before closing Codex."
        Start-Sleep -Seconds $DelaySeconds
    }

    $runningCodex = Get-Process -Name Codex, codex -ErrorAction SilentlyContinue
    if ($runningCodex) {
        Write-Step "Stopping Codex processes."
        $runningCodex | Stop-Process -Force
        Start-Sleep -Seconds 2
    }

    $repairParams = @{
        KillCodex   = $true
        ResetUiCache = $true
    }

    if ($RestartCodex) {
        $repairParams.RestartCodex = $true
    }

    if ($PreferGitCanonicalRoots) {
        $repairParams.PreferGitCanonicalRoots = $true
    }

    Write-Step "Running repair script."
    & $repairScript @repairParams

    if ($LASTEXITCODE -ne 0) {
        throw "Repair script failed with exit code $LASTEXITCODE"
    }

    Write-Step "Detached repair finished successfully."
}
finally {
    Stop-Transcript | Out-Null
}
