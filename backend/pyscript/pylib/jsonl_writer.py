import json
from pathlib import Path
from pylib.config import ALL_FILES


def ensure_parent_directory(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)


def ensure_all_directories():
    for file in ALL_FILES:
        ensure_parent_directory(file)


def append_records(output_file, records):
    with open(output_file, "a", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False))
            f.write("\n")
