import time
from functools import wraps


def measure_runtime(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            duration = time.perf_counter() - start
            hours = int(duration // 3600)
            minutes = int((duration % 3600) // 60)
            seconds = int(duration % 60)
            milliseconds = int((duration - int(duration)) * 1000)

            print(
                f"{func.__name__} lief "
                f"{hours:02d}:{minutes:02d}:{seconds:02d}.{milliseconds:03d}"
            )

    return wrapper
