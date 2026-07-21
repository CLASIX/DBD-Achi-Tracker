from __future__ import annotations

from collections import defaultdict, deque
from threading import Lock
from time import monotonic


class InMemoryRateLimiter:
    def __init__(self, max_requests: int = 30, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def is_allowed(self, key: str) -> tuple[bool, int]:
        if self.max_requests <= 0 or self.window_seconds <= 0:
            return True, 0

        now = monotonic()
        cutoff = now - self.window_seconds

        with self._lock:
            queue = self._events[key]
            while queue and queue[0] <= cutoff:
                queue.popleft()

            if len(queue) >= self.max_requests:
                retry_after = max(1, int(self.window_seconds - (now - queue[0])) + 1)
                return False, retry_after

            queue.append(now)
            return True, 0
