import json

from pathlib import Path


def ensure_parent_directory(path):
    Path(path).parent.mkdir(
        parents=True,
        exist_ok=True
    )


def append_records(output_file, records):
    with open(output_file, "a", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False))
            f.write("\n")