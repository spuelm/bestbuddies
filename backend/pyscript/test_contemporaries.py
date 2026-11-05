import json
from lib.find_contemporaries import find_contemporaries
from pylib.config import (
    PERSON_CANDIDATES_WITH_CENTURIES_FILE,
    CENTURY_INDEX_FILE,
)

PEOPLE_FILE = PERSON_CANDIDATES_WITH_CENTURIES_FILE

ROOT_PERSON_QID = "Q5879"  # Goethe
# ROOT_PERSON_QID = "Q37030"  # Thomas Mann


def load_people():
    people_by_qid = {}

    with open(PEOPLE_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            person = json.loads(line)
            people_by_qid[person["wikidataId"]] = person

    return people_by_qid


def run():
    people_by_qid = load_people()

    with open(CENTURY_INDEX_FILE, "r", encoding="utf-8") as f:
        century_index = json.load(f)

    target_person = people_by_qid[ROOT_PERSON_QID]

    result = find_contemporaries(
        target_person["wikidataId"],
        people_by_qid,
        century_index,
    )

    display_length = 50

    print(json.dumps(result[:display_length], indent=2, ensure_ascii=False))

    print(f"Gefundene Zeitgenossen: {result.__len__():,}".replace(",", "."))
    print(f"Angezeigt werden die ersten " f"{min(display_length, len(result))} Treffer")


if __name__ == "__main__":
    run()
