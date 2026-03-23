param(
    [switch]$DryRun,
    [switch]$KillCodex,
    [switch]$RestartCodex,
    [switch]$AllowRunning,
    [switch]$ResetUiCache,
    [switch]$PreferGitCanonicalRoots
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[repair-codex-chat-index] $Message"
}

function Backup-ItemIfExists {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$BackupRoot,
        [switch]$RemoveAfterBackup
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

    if ($RemoveAfterBackup) {
        Remove-Item -LiteralPath $Path -Recurse -Force
    }
}

$codexHome = Join-Path $env:USERPROFILE ".codex"
$packageRoot = Join-Path $env:LOCALAPPDATA "Packages\OpenAI.Codex_2p2nqsd0c76g0"
$roamingCodex = Join-Path $packageRoot "LocalCache\Roaming\Codex"
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
    },
    @{
        old = "\\?\UNC\192.168.200.2\projects\sayxun"
        new = "X:\sayxun"
    }
)
$uiCachePathsToReset = @(
    (Join-Path $roamingCodex "blob_storage"),
    (Join-Path $roamingCodex "Local Storage"),
    (Join-Path $roamingCodex "Session Storage"),
    (Join-Path $roamingCodex "SharedStorage"),
    (Join-Path $roamingCodex "SharedStorage-wal"),
    (Join-Path $roamingCodex "Network"),
    (Join-Path $roamingCodex "Cache"),
    (Join-Path $roamingCodex "Code Cache"),
    (Join-Path $roamingCodex "GPUCache")
)

Write-Step "Codex processes must be closed before repair."
$runningCodex = Get-Process -Name Codex, codex -ErrorAction SilentlyContinue
if ($runningCodex) {
    $runningCodex | Select-Object ProcessName, Id, Path | Format-Table -AutoSize

    if ($DryRun) {
        Write-Step "Codex is running, but continuing because -DryRun does not modify files."
    }
    elseif ($KillCodex) {
        Write-Step "Stopping Codex processes"
        if (-not $DryRun) {
            $runningCodex | Stop-Process -Force
            Start-Sleep -Seconds 2
        }
    }
    elseif ($AllowRunning) {
        throw "Live repair while Codex is open is unsafe because running processes can write stale thread metadata back into state_5.sqlite. Close Codex first, or rerun with -KillCodex."
    }
    else {
        throw "Close all Codex processes, then run this script again. Or rerun with -KillCodex."
    }
}

Write-Step "Creating backup folder: $backupRoot"
if (-not $DryRun) {
    New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
}

foreach ($path in $pathsToBackup) {
    Backup-ItemIfExists -Path $path -BackupRoot $backupRoot
}

if ($ResetUiCache) {
    Write-Step "Resetting Codex UI cache after backup"
    foreach ($path in $uiCachePathsToReset) {
        Backup-ItemIfExists -Path $path -BackupRoot $backupRoot -RemoveAfterBackup
    }
}

$env:CODEX_HOME_PATH = $codexHome
$env:CODEX_DRY_RUN = if ($DryRun) { "1" } else { "0" }
$env:CODEX_PREFER_GIT_CANONICAL_ROOTS = if ($PreferGitCanonicalRoots) { "1" } else { "0" }
$env:CODEX_PATH_MAPPINGS = $pathMappings | ConvertTo-Json -Compress

$pythonScript = @'
import datetime
import json
import os
import pathlib
import sqlite3
import subprocess

codex_home = pathlib.Path(os.environ["CODEX_HOME_PATH"])
dry_run = os.environ.get("CODEX_DRY_RUN") == "1"
prefer_git_canonical_roots = os.environ.get("CODEX_PREFER_GIT_CANONICAL_ROOTS") == "1"
path_mappings = json.loads(os.environ["CODEX_PATH_MAPPINGS"])

db_path = codex_home / "state_5.sqlite"
sessions_root = codex_home / "sessions"
session_index_path = codex_home / "session_index.jsonl"


def normalize_path_style(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.replace("/", "\\")

    if len(normalized) >= 3 and normalized[1:3] == ":\\":
        normalized = normalized[0].upper() + normalized[1:]

    return normalized


def to_plain_unc(value: str | None) -> str | None:
    normalized = normalize_path_style(value)
    if normalized is None:
        return None

    extended_unc_prefix = "\\\\?\\UNC\\"
    if normalized.startswith(extended_unc_prefix):
        return "\\\\" + normalized[len(extended_unc_prefix) :]

    return normalized


def to_extended_unc(value: str | None) -> str | None:
    normalized = normalize_path_style(value)
    if normalized is None:
        return None

    if normalized.startswith("\\\\?\\UNC\\"):
        return normalized

    if normalized.startswith("\\\\") and not normalized.startswith("\\\\?\\"):
        return "\\\\?\\UNC\\" + normalized[2:]

    return normalized


def equivalent_prefixes(value: str | None) -> list[str]:
    normalized = normalize_path_style(value)
    if normalized is None:
        return []

    variants = []
    for candidate in (
        normalized,
        to_plain_unc(normalized),
        to_extended_unc(normalized),
    ):
        if candidate and candidate not in variants:
            variants.append(candidate)

    return variants


def normalize_cwd(value: str | None) -> str | None:
    normalized = normalize_path_style(value)
    if normalized is None:
        return None

    for source, target in path_prefix_rules:
        if normalized == source:
            return target

        prefix = source + "\\"
        if normalized.startswith(prefix):
            return target + normalized[len(source) :]

    return normalized


_git_root_cache: dict[str, str | None] = {}


def get_git_canonical_root(path: str | None) -> str | None:
    normalized = normalize_path_style(path)
    if normalized is None:
        return None

    cached = _git_root_cache.get(normalized)
    if cached is not None or normalized in _git_root_cache:
        return cached

    try:
        result = subprocess.run(
            ["git", "-C", normalized, "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except Exception:
        _git_root_cache[normalized] = None
        return None

    if result.returncode != 0:
        _git_root_cache[normalized] = None
        return None

    git_root = normalize_path_style(result.stdout.strip())
    _git_root_cache[normalized] = git_root
    return git_root


canonical_root_findings = []
path_prefix_rules: list[tuple[str, str]] = []


def add_prefix_rule(source: str | None, target: str | None) -> None:
    normalized_target = normalize_path_style(target)
    if source is None or normalized_target is None:
        return

    for variant in equivalent_prefixes(source):
        rule = (variant, normalized_target)
        if rule not in path_prefix_rules:
            path_prefix_rules.append(rule)

for mapping in path_mappings:
    old = normalize_path_style(mapping["old"])
    configured_new = normalize_path_style(mapping["new"])
    git_canonical_root = get_git_canonical_root(configured_new)
    effective_new = (
        git_canonical_root
        if prefer_git_canonical_roots and git_canonical_root is not None
        else configured_new
    )

    add_prefix_rule(old, effective_new)

    if (
        prefer_git_canonical_roots
        and git_canonical_root is not None
        and configured_new != git_canonical_root
    ):
        add_prefix_rule(configured_new, git_canonical_root)

    canonical_root_findings.append(
        {
            "old": old,
            "configured_new": configured_new,
            "git_canonical_root": git_canonical_root,
            "effective_new": effective_new,
            "canonical_mismatch": (
                git_canonical_root is not None and git_canonical_root != configured_new
            ),
        }
    )


def read_session_meta_cwd(rollout_path: pathlib.Path) -> str | None:
    if not rollout_path.exists():
        return None

    with rollout_path.open("r", encoding="utf-8", errors="ignore") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue

            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                continue

            if payload.get("type") != "session_meta":
                continue

            meta = payload.get("payload") or {}
            return meta.get("cwd")

    return None


PATH_FIELD_NAMES = {
    "cwd",
    "workdir",
    "workspace",
    "workspace_root",
    "workspaceRoot",
}


def normalize_paths_in_structure(value) -> bool:
    changed = False

    if isinstance(value, dict):
        for key, child in list(value.items()):
            if key in PATH_FIELD_NAMES and isinstance(child, str):
                normalized_child = normalize_cwd(child)
                if normalized_child != child:
                    value[key] = normalized_child
                    changed = True
            else:
                changed = normalize_paths_in_structure(child) or changed
    elif isinstance(value, list):
        for child in value:
            changed = normalize_paths_in_structure(child) or changed

    return changed


def patch_session_file(path: pathlib.Path) -> bool:
    original_text = path.read_text(encoding="utf-8", errors="ignore")
    had_trailing_newline = original_text.endswith("\n")
    output_lines: list[str] = []
    changed = False

    for line in original_text.splitlines():
        stripped = line.strip()
        if not stripped:
            output_lines.append(line)
            continue

        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            output_lines.append(line)
            continue

        line_changed = normalize_paths_in_structure(payload)
        output_lines.append(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
        changed = line_changed or changed

    if not changed:
        return False

    if not dry_run:
        patched_text = "\n".join(output_lines)
        if had_trailing_newline:
            patched_text += "\n"
        path.write_text(patched_text, encoding="utf-8")

    return True


con = sqlite3.connect(str(db_path))
cur = con.cursor()

rows = cur.execute(
    """
    select id, title, cwd, rollout_path, updated_at, archived
    from threads
    order by updated_at desc
    """
).fetchall()

before_counts = {}
for _, _, cwd, _, _, _ in rows:
    before_counts[cwd] = before_counts.get(cwd, 0) + 1

updated_threads = []
missing_rollout_paths = []
session_meta_missing = []
discovered_path_mappings = {}

for thread_id, title, current_cwd, rollout_path, updated_at, archived in rows:
    rollout = pathlib.Path(rollout_path)
    if not rollout.exists():
        missing_rollout_paths.append(str(rollout))
        desired_cwd = normalize_cwd(current_cwd)
    else:
        session_meta_cwd = read_session_meta_cwd(rollout)
        if session_meta_cwd is None:
            session_meta_missing.append(str(rollout))
            desired_cwd = normalize_cwd(current_cwd)
        else:
            desired_cwd = normalize_cwd(session_meta_cwd)

    if current_cwd != desired_cwd and current_cwd is not None and desired_cwd is not None:
        discovered_path_mappings[current_cwd] = desired_cwd

    if desired_cwd != current_cwd:
        updated_threads.append(
            {
                "id": thread_id,
                "title": title,
                "old_cwd": current_cwd,
                "new_cwd": desired_cwd,
            }
        )
        if not dry_run:
            cur.execute(
                "update threads set cwd = ? where id = ?",
                (desired_cwd, thread_id),
            )

if not dry_run:
    con.commit()
    cur.execute("pragma wal_checkpoint(full)")

rows_after = cur.execute(
    """
    select id, title, cwd, updated_at, archived
    from threads
    order by updated_at desc
    """
).fetchall()
con.close()

patched_session_files = []
for path in sessions_root.rglob("*.jsonl"):
    if patch_session_file(path):
        patched_session_files.append(str(path))

session_index_lines = []
after_counts = {}
updated_thread_map = {
    item["id"]: item["new_cwd"]
    for item in updated_threads
}
for thread_id, title, cwd, updated_at, archived in rows_after:
    effective_cwd = updated_thread_map.get(thread_id, cwd)
    after_counts[effective_cwd] = after_counts.get(effective_cwd, 0) + 1
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

verification_rows = []
for thread_id, title, cwd, updated_at, archived in rows_after:
    effective_cwd = updated_thread_map.get(thread_id, cwd)
    verification_rows.append((thread_id, title, effective_cwd))

remaining_unmapped_threads = [
    [thread_id, title, cwd]
    for thread_id, title, cwd in verification_rows
    if normalize_cwd(cwd) != cwd
]

remaining_unc_threads = [
    [thread_id, title, cwd]
    for thread_id, title, cwd in verification_rows
    if cwd is not None and normalize_path_style(cwd).startswith("\\\\")
]

result = {
    "updated_thread_count": len(updated_threads),
    "updated_threads": updated_threads,
    "detected_path_mappings": discovered_path_mappings,
    "prefer_git_canonical_roots": prefer_git_canonical_roots,
    "canonical_root_findings": canonical_root_findings,
    "canonical_root_mismatch_count": sum(
        1 for item in canonical_root_findings if item["canonical_mismatch"]
    ),
    "patched_session_file_count": len(patched_session_files),
    "patched_session_files": patched_session_files,
    "session_index_count": len(session_index_lines),
    "cwd_counts_before": before_counts,
    "cwd_counts_after": after_counts,
    "missing_rollout_path_count": len(missing_rollout_paths),
    "missing_rollout_paths": missing_rollout_paths,
    "session_meta_missing_count": len(session_meta_missing),
    "session_meta_missing": session_meta_missing,
    "remaining_unmapped_thread_count": len(remaining_unmapped_threads),
    "remaining_unmapped_threads": remaining_unmapped_threads,
    "remaining_unc_thread_count": len(remaining_unc_threads),
    "remaining_unc_threads": remaining_unc_threads,
}

print(json.dumps(result, ensure_ascii=False, indent=2))
'@

Write-Step "Syncing thread cwd values from rollout session metadata and rebuilding session index"
$result = $pythonScript | python -
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
    throw "Repair script failed with exit code $exitCode"
}

Write-Step "Repair summary:"
Write-Host $result

if ($PreferGitCanonicalRoots) {
    Write-Step "Git canonical roots were preferred when they differed from drive-letter mappings."
}
else {
    Write-Step "If canonical_root_mismatch_count is greater than 0, Codex can rewrite drive-letter cwd values back to UNC on next launch."
}

if ($ResetUiCache) {
    Write-Step "UI cache reset completed. Codex will rebuild sidebar state on next launch."
}

if ($RestartCodex) {
    Write-Step "Restarting Codex"
    if (-not $DryRun) {
        Start-Process explorer.exe "shell:AppsFolder\OpenAI.Codex_2p2nqsd0c76g0!App"
    }
}

Write-Step "Done."
