import json
from collections import defaultdict
from pylib.jsonl_writer import ensure_parent_directory
import pylib.config as cfg
from pylib.utils import measure_runtime

INPUT_FILE = cfg.RESULT_PHASE_4_FILE
OUTPUT_FILE = cfg.USED_OCCUPATIONS_FILE


@measure_runtime
def run():
    print(f"Inputfile:  {INPUT_FILE}")
    print(f"Statefile:  {OUTPUT_FILE}")
    ensure_parent_directory(OUTPUT_FILE)
    occupations = defaultdict(int)
    processed = 0
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            person = json.loads(line)
            occupation_ids = person.get("occupationIds") or []
            for occupation_id in occupation_ids:
                occupations[occupation_id] += 1
            processed += 1
            if processed % 100000 == 0:
                print(f"{processed:,}".replace(",", ".") + " Personen geprüft")
    result = [
        {
            "occupationId": occupation_id,
            "count": count,
        }
        for occupation_id, count in occupations.items()
    ]
    result.sort(key=lambda x: x["count"], reverse=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"{len(result):,}".replace(",", ".") + " unterschiedliche Berufe exportiert")


if __name__ == "__main__":
    run()
