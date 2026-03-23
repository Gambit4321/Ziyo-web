import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class GitAutoPushHandler(FileSystemEventHandler):
    def __init__(self):
        self.last_run = 0

    def on_any_event(self, event):
        now = time.time()

        if now - self.last_run < 10:
            return

        self.last_run = now

        print("Change detected → pushing...")

        os.system("git add .")
        os.system(f'git commit -m "auto: {time.ctime()}"')
        os.system("git push")

if __name__ == "__main__":
    path = "."
    event_handler = GitAutoPushHandler()
    observer = Observer()
    observer.schedule(event_handler, path, recursive=True)
    observer.start()

    print("Auto Git Push Started...")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()

    observer.join()