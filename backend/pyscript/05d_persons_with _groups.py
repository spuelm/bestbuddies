import json
from pylib.utils import measure_runtime
from pylib.jsonl_writer import ensure_all_directories
import pylib.config as cfg

INPUT_JSONL = cfg.PERSONS_WITH_LOCATION_FILE
LOOKUP_JSON = cfg.OCCUPATION_GROUP_CACHE_FILE
OUTPUT_JSONL = cfg.PERSONS_WITH_OCCUPATION_FILE


def get_primary_qid(person):
    occupation_ids = person.get("occupationIds") or []
    if occupation_ids:
        return occupation_ids[0]

    positions_held = person.get("positionsHeld") or []
    if positions_held:
        return positions_held[0]

    return None


@measure_runtime
def run():
    print(f"Inputfile:  {INPUT_JSONL}")
    print(f"Lookupfile: {LOOKUP_JSON}")
    print(f"Outputfile: {OUTPUT_JSONL}")
    ensure_all_directories()
    # Lookup-Datei laden
    with open(LOOKUP_JSON, "r", encoding="utf-8") as f:
        lookup = json.load(f)

    processed = 0
    matched = 0

    with open(INPUT_JSONL, "r", encoding="utf-8") as fin, open(
        OUTPUT_JSONL, "w", encoding="utf-8"
    ) as fout:

        for line in fin:
            line = line.strip()
            if not line:
                continue

            person = json.loads(line)

            qid = get_primary_qid(person)

            if qid and qid in lookup:
                #    person["occupationInfo"] = lookup[qid]
                person["mainOccupationName"] = lookup[qid].get("clearname")
                person["mainOccupationGroup"] = lookup[qid].get("group")
                matched += 1
            else:
                #  person["occupationInfo"] = None
                person["mainOccupationName"] = None
                person["mainOccupationGroup"] = None

            fout.write(json.dumps(person, ensure_ascii=False) + "\n")

            processed += 1

            if processed % 100000 == 0:
                print(f"{processed:,} verarbeitet")

    print(f"Fertig. {processed:,} Datensätze verarbeitet.")
    print(f"Treffer: {matched:,}")


if __name__ == "__main__":
    run()
