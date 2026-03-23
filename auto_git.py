import os
import time
import subprocess
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

PROJECT_DIR = Path(r"W:\ziyo-web").resolve()

IGNORE_DIRS = {
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    "__pycache__",
    ".venv",
    "venv",
    ".codex",
}

IGNORE_FILES = {
    "auto_git.log",
}

COMMIT_DELAY_SECONDS = 10


def is_ignored(path_str: str) -> bool:
    path_lower = path_str.lower().replace("\\", "/")

    for part in IGNORE_DIRS:
        token = f"/{part.lower()}/"
        if token in f"/{path_lower}/":
            return True

    filename = os.path.basename(path_lower)
    if filename in {name.lower() for name in IGNORE_FILES}:
        return True

    return False


def run_git_command(args):
    result = subprocess.run(
        ["git"] + args,
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        shell=False
    )
    return result


def append_log(text: str):
    log_path = PROJECT_DIR / "auto_git.log"
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {text}\n")


class GitAutoPushHandler(FileSystemEventHandler):
    def __init__(self):
        self.last_event_time = 0

    def handle_change(self, event_path: str):
        if is_ignored(event_path):
            return

        now = time.time()
        if now - self.last_event_time < COMMIT_DELAY_SECONDS:
            return

        self.last_event_time = now
        print(f"Change detected: {event_path}")
        append_log(f"Change detected: {event_path}")

        time.sleep(COMMIT_DELAY_SECONDS)

        add_result = run_git_command(["add", "-A"])
        if add_result.returncode != 0:
            print(add_result.stderr)
            append_log(f"git add -A failed: {add_result.stderr}")
            return

        diff_result = run_git_command(["diff", "--cached", "--quiet"])
        if diff_result.returncode == 0:
            print("No staged changes. Nothing to commit.")
            append_log("No staged changes. Nothing to commit.")
            return

        commit_message = f"auto: {time.strftime('%Y-%m-%d %H:%M:%S')}"
        commit_result = run_git_command(["commit", "-m", commit_message])
        if commit_result.returncode != 0:
            print(commit_result.stdout)
            print(commit_result.stderr)
            append_log(f"git commit failed: {commit_result.stdout} {commit_result.stderr}")
            return

        push_result = run_git_command(["push"])
        if push_result.returncode != 0:
            print(push_result.stdout)
            print(push_result.stderr)
            append_log(f"git push failed: {push_result.stdout} {push_result.stderr}")
            return

        print("Auto commit + push done.")
        append_log("Auto commit + push done.")

    def on_modified(self, event):
        if not event.is_directory:
            self.handle_change(event.src_path)

    def on_created(self, event):
        if not event.is_directory:
            self.handle_change(event.src_path)

    def on_deleted(self, event):
        if not event.is_directory:
            self.handle_change(event.src_path)

    def on_moved(self, event):
        if not event.is_directory:
            self.handle_change(event.src_path)


if __name__ == "__main__":
    os.chdir(PROJECT_DIR)

    print("Auto Git Push Started...")
    append_log("Watcher started.")

    event_handler = GitAutoPushHandler()
    observer = Observer()
    observer.schedule(event_handler, str(PROJECT_DIR), recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        append_log("Watcher stopped by keyboard interrupt.")

    observer.join()