param(
    [switch]$DryRun,
    [switch]$KillCodex,
    [switch]$RestartCodex
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[repair-codex-chat-index] $Message"
}

function Backup-ItemIfExists {
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
}

$codexHome = Join-Path $env:USERPROFILE ".codex"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $codexHome "backups\codex-chat-index-repair-$timestamp"
$pathsToBackup = @(
    (Join-Path $codexHome "state_5.sqlite"),
    (Join-Path $codexHome "state_5.sqlite-shm"),
    (Join-Path $codexHome "state_5.sqlite-wal"),
    (Join-Path $codexHome "session_index.jsonl"),
    (Join-Path $codexHome "sessions")
)

$pathMappings = @(
    @{
        old = "\\?\UNC\192.168.200.205\ziyoweb\ziyo-web"
        new = "W:\ziyo-web"
    },
    @{
        old = "\\?\UNC\192.168.200.50\storage\socetra"
        new = "V:\socetra"
    }
)

Write-Step "Codex processes must be closed before repair."
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

foreach ($path in $pathsToBackup) {
    Backup-ItemIfExists -Path $path -BackupRoot $backupRoot
}

$env:CODEX_HOME_PATH = $codexHome
$env:CODEX_DRY_RUN = if ($DryRun) { "1" } else { "0" }
$env:CODEX_PATH_MAPPINGS = $pathMappings | ConvertTo-Json -Compress

$pythonScript = @'
import datetime
import json
import os
import pathlib
import sqlite3
import sys

codex_home = pathlib.Path(os.environ["CODEX_HOME_PATH"])
dry_run = os.environ.get("CODEX_DRY_RUN") == "1"
path_mappings = json.loads(os.environ["CODEX_PATH_MAPPINGS"])

db_path = codex_home / "state_5.sqlite"
con = sqlite3.connect(str(db_path))
cur = con.cursor()

updated_threads = []
for mapping in path_mappings:
    rows = cur.execute(
        "select id, cwd from threads where cwd = ? order by updated_at desc",
        (mapping["old"],),
    ).fetchall()
    if rows:
        for thread_id, old_cwd in rows:
            updated_threads.append(
                {
                    "id": thread_id,
                    "old_cwd": old_cwd,
                    "new_cwd": mapping["new"],
                }
            )
        if not dry_run:
            cur.execute(
                "update threads set cwd = ? where cwd = ?",
                (mapping["new"], mapping["old"]),
            )

if not dry_run:
    con.commit()

rows = cur.execute(
    """
    select id, title, updated_at, archived
    from threads
    order by updated_at desc
    """
).fetchall()
con.close()

patched_session_files = []
sessions_root = codex_home / "sessions"
for path in sessions_root.rglob("*.jsonl"):
    original_text = path.read_text(encoding="utf-8")
    patched_text = original_text
    for mapping in path_mappings:
        patched_text = patched_text.replace(mapping["old"], mapping["new"])

    if patched_text != original_text:
        patched_session_files.append(str(path))
        if not dry_run:
            path.write_text(patched_text, encoding="utf-8")

session_index_path = codex_home / "session_index.jsonl"
session_index_lines = []
for thread_id, title, updated_at, archived in rows:
    if archived:
        continue
    updated_at_iso = datetime.datetime.fromtimestamp(
        updated_at, tz=datetime.timezone.utc
    ).isoformat().replace("+00:00", "Z")
    session_index_lines.append(
        json.dumps(
            {
                "id": thread_id,
                "thread_name": title,
                "updated_at": updated_at_iso,
            },
            ensure_ascii=False,
        )
    )

if not dry_run:
    payload = "\n".join(session_index_lines)
    if payload:
        payload += "\n"
    session_index_path.write_text(payload, encoding="utf-8")

result = {
    "updated_thread_count": len(updated_threads),
    "updated_threads": updated_threads,
    "patched_session_file_count": len(patched_session_files),
    "patched_session_files": patched_session_files,
    "session_index_count": len(session_index_lines),
}

print(json.dumps(result, ensure_ascii=False, indent=2))
'@

Write-Step "Repairing thread cwd mappings and rebuilding session index"
$result = $pythonScript | python -
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
    throw "Repair script failed with exit code $exitCode"
}

Write-Step "Repair summary:"
Write-Host $result

if ($RestartCodex) {
    Write-Step "Restarting Codex"
    if (-not $DryRun) {
        Start-Process explorer.exe "shell:AppsFolder\OpenAI.Codex_2p2nqsd0c76g0!App"
    }
}

Write-Step "Done."
