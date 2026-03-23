param(
    [switch]$DryRun,
    [switch]$KillCodex,
    [switch]$RestartCodex,
    [switch]$PreferGitCanonicalRoots
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[fix-codex-sidebar] $Message"
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repairScript = Join-Path $scriptRoot "repair_codex_chat_index.ps1"

if (-not (Test-Path -LiteralPath $repairScript)) {
    throw "Repair script not found: $repairScript"
}

$repairParams = @{
    ResetUiCache = $true
}

if ($DryRun) {
    $repairParams.DryRun = $true
}

if ($KillCodex) {
    $repairParams.KillCodex = $true
}

if ($RestartCodex) {
    $repairParams.RestartCodex = $true
}

if ($PreferGitCanonicalRoots) {
    $repairParams.PreferGitCanonicalRoots = $true
}

Write-Step "Delegating to repair_codex_chat_index.ps1 with UI cache reset enabled."
& $repairScript @repairParams

if ($LASTEXITCODE -ne 0) {
    throw "Repair script failed with exit code $LASTEXITCODE"
}
