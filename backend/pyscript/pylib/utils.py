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


RESET = "\033[0m"
RED = "\033[31m"
GREEN = "\033[32m"
ORANGE = "\033[33m"


def printcolor(*objects, sep=" ", end="\n", file=None, flush=False, color=None):
    """
    Print with color support.
    :param objects: Objects to print.
    :param sep: Separator between objects.
    :param end: End character.
    :param file: File to print to.
    :param flush: Whether to flush the output.
    :param color: Color code (e.g., "\033[91m" for red).
    """
    if color:
        print(color, end="")
    print(*objects, sep=sep, end=end, file=file, flush=flush)
    if color:
        print("\033[0m", end="")  # Reset color
