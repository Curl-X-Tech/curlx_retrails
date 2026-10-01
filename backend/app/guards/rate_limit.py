import time
from collections import defaultdict
from collections.abc import Callable

from fastapi import HTTPException, Request, status


class RateLimitGuard:
    """Sliding-window in-memory rate limiter guard."""

    def __init__(
        self,
        requests_per_minute: int = 60,
        window_seconds: float = 60.0,
        key_func: Callable[[Request], str] | None = None,
    ):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = window_seconds
        self.key_func = key_func
        self._requests: dict[str, list[float]] = defaultdict(list)

    def _get_key(self, request: Request) -> str:
        if self.key_func:
            return self.key_func(request)
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    def reset(self) -> None:
        self._requests.clear()

    async def __call__(self, request: Request) -> None:
        key = self._get_key(request)
        now = time.monotonic()
        window_start = now - self.window_seconds
        timestamps = [
            timestamp for timestamp in self._requests[key] if timestamp > window_start
        ]
        if len(timestamps) >= self.requests_per_minute:
            retry_after = int(self.window_seconds - (now - timestamps[0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(max(1, retry_after))},
            )
        timestamps.append(now)
        self._requests[key] = timestamps


# Standard Rate Limiter instances
auth_rate_limiter = RateLimitGuard(requests_per_minute=20)
register_rate_limiter = RateLimitGuard(requests_per_minute=10)
api_rate_limiter = RateLimitGuard(requests_per_minute=100)
