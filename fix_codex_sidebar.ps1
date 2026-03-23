param(
    [switch]$DryRun,
    [switch]$KillCodex,
    [switch]$RestartCodex
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[fix-codex-sidebar] $Message"
}

function Backup-And-Remove {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$BackupRoot
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        Write-Step "Skip, not found: $Path"
        return
    }

    $leaf = Split-Path -Path $Path -Leaf
    $destination = Join-Path $BackupRoot $leaf
    Write-Step "Backup: $Path -> $destination"

    if ($DryRun) {
        return
    }

    Copy-Item -LiteralPath $Path -Destination $destination -Recurse -Force
    Remove-Item -LiteralPath $Path -Recurse -Force
}

$codexHome = Join-Path $env:USERPROFILE ".codex"
$packageRoot = Join-Path $env:LOCALAPPDATA "Packages\OpenAI.Codex_2p2nqsd0c76g0"
$roamingCodex = Join-Path $packageRoot "LocalCache\Roaming\Codex"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $codexHome "backups\codex-sidebar-reset-$timestamp"
$pathsToReset = @(
    (Join-Path $codexHome "session_index.jsonl"),
    (Join-Path $roamingCodex "Local Storage"),
    (Join-Path $roamingCodex "Session Storage"),
    (Join-Path $roamingCodex "SharedStorage"),
    (Join-Path $roamingCodex "SharedStorage-wal"),
    (Join-Path $roamingCodex "Cache"),
    (Join-Path $roamingCodex "Code Cache"),
    (Join-Path $roamingCodex "GPUCache")
)

Write-Step "Codex processes must be closed before cleanup."
$runningCodex = Get-Process -Name Codex, codex -ErrorAction SilentlyContinue
if ($runningCodex) {
    $runningCodex | Select-Object ProcessName, Id, Path | Format-Table -AutoSize
    if (-not $KillCodex) {
        throw "Close all Codex processes, then run this script again. Or rerun with -KillCodex."
    }

    Write-Step "Stopping Codex processes"
    if (-not $DryRun) {
        $runningCodex | Stop-Process -Force
        Start-Sleep -Seconds 2
    }
}

Write-Step "Creating backup folder: $backupRoot"
if (-not $DryRun) {
    New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
}

foreach ($path in $pathsToReset) {
    Backup-And-Remove -Path $path -BackupRoot $backupRoot
}

if ($RestartCodex) {
    Write-Step "Restarting Codex"
    if (-not $DryRun) {
        Start-Process explorer.exe "shell:AppsFolder\OpenAI.Codex_2p2nqsd0c76g0!App"
    }
}

Write-Step "Done. Start Codex again and let it rebuild the sidebar state."
