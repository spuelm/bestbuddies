import json
import os
import time
from datetime import datetime

from pylib.wiki_api import (
    wdata_load_entities,
    P_POSITION_HELT,
    P_BITRH_YEAR,
    P_DEATH_YEAR,
    P_NATIONALITIES,
    P_OCCUPATIONS,
    P_GIVEN_NAMES,
    P_FANILY_NAMES,
    P_BIRTH_PLACE,
)

from pylib.state_manager import load_state, save_state
from pylib.jsonl_writer import append_records
from pylib.config import (
    ALL_ARTICLES_FILE_SORTED,
    HUMAN_FILE_SORTED,
    HUMAN_STATE_FILE_SORTED,
    P31_STATS_FILE_SORTED,
)

MAX_HUMANS = 5_000_000

INPUT_FILE = ALL_ARTICLES_FILE_SORTED
OUTPUT_FILE = HUMAN_FILE_SORTED
STATE_FILE = HUMAN_STATE_FILE_SORTED
STATISTICS_FILE = P31_STATS_FILE_SORTED

BATCH_SIZE = 50

last_title = ""
last_article_length = 0


def get_single_entity_id(claims, property_id):
    try:
        return claims[property_id][0]["mainsnak"]["datavalue"]["value"]["id"]
    except (KeyError, IndexError, TypeError):
        return None


def get_year(claims, property_id):
    try:
        time_value = claims[property_id][0]["mainsnak"]["datavalue"]["value"]["time"]
    except (KeyError, IndexError, TypeError):
        return None

    if not time_value:
        return None

    import re

    match = re.match(r"^([+-]?\d+)", time_value)
    if not match:
        return None

    return int(match.group(1))


def get_entity_ids(claims, property_id):
    values = claims.get(property_id, [])

    result = []
    for item in values:
        try:
            qid = item["mainsnak"]["datavalue"]["value"]["id"]
            if qid:
                result.append(qid)
        except (KeyError, TypeError):
            pass

    return result


def process_batch(batch, stats):
    global last_title, last_article_length

    qids = [item["wikidataId"] for item in batch]

    while True:
        try:
            entities = wdata_load_entities(qids)

            if not isinstance(entities, dict):
                raise RuntimeError("Keine gültigen Entities erhalten")
            break

        except Exception as err:
            response = getattr(err, "response", None)

            if response and getattr(response, "status_code", None) == 429:
                retry_after = int(response.headers.get("retry-after", 60))
                print(f"429 erhalten. Warte {retry_after}s")
                time.sleep(retry_after)
                continue

            raise

    humans = []

    for item in batch:

        entity = entities.get(item["wikidataId"])

        if not entity:
            print(f"Entity fehlt: {item['wikidataId']}")
            continue

        claims = entity.get("claims", {})
        p31 = claims.get("P31", [])

        birth_year = get_year(
            claims,
            P_BITRH_YEAR,
        )

        death_year = get_year(
            claims,
            P_DEATH_YEAR,
        )

        nationality_ids = get_entity_ids(
            claims,
            P_NATIONALITIES,
        )

        occupation_ids = get_entity_ids(
            claims,
            P_OCCUPATIONS,
        )

        positions_held = get_entity_ids(
            claims,
            P_POSITION_HELT,
        )

        given_name_ids = get_entity_ids(
            claims,
            P_GIVEN_NAMES,
        )

        family_name_ids = get_entity_ids(
            claims,
            P_FANILY_NAMES,
        )

        birth_place_id = get_single_entity_id(
            claims,
            P_BIRTH_PLACE,
        )

        is_human = False

        for claim in p31:

            try:
                type_id = claim["mainsnak"]["datavalue"]["value"]["id"]
            except (KeyError, TypeError):
                continue

            stats[type_id] = stats.get(type_id, 0) + 1

            if type_id == "Q5":
                is_human = True

        last_article_length = item["articleLength"]

        if is_human:
            last_title = item["title"]

            humans.append(
                {
                    "pageid": item["pageid"],
                    "ns": item["ns"],
                    "title": item["title"],
                    "wikidataId": item["wikidataId"],
                    "articleLength": item["articleLength"],
                    "birthYear": birth_year,
                    "deathYear": death_year,
                    "nationalityIds": nationality_ids,
                    "occupationIds": occupation_ids,
                    "positionsHeld": positions_held,
                    "givenNameIds": given_name_ids,
                    "familyNameIds": family_name_ids,
                    "birthPlaceId": birth_place_id,
                }
            )

    return humans


def run():

    state = load_state(HUMAN_STATE_FILE_SORTED)

    stats = {}

    if os.path.exists(P31_STATS_FILE_SORTED):
        with open(
            P31_STATS_FILE_SORTED,
            "r",
            encoding="utf-8",
        ) as f:
            stats = json.load(f)

    processed = state.get("processed", 0)

    humans = state.get("humans", 0)

    current_line = 0

    start_line = state.get(
        "lineNumber",
        0,
    )

    print(f"Fortsetzen bei Zeile {start_line:,}")

    batch = []

    with open(
        INPUT_FILE,
        "r",
        encoding="utf-8",
    ) as infile:

        for line in infile:

            current_line += 1

            if current_line < start_line:
                continue

            item = json.loads(line)

            if not item.get("hasQid"):
                continue

            batch.append(item)

            if len(batch) < BATCH_SIZE:
                continue

            try:

                results = process_batch(
                    batch,
                    stats,
                )

                humans += len(results)

                if humans >= MAX_HUMANS:

                    print(f"Ziel erreicht: {MAX_HUMANS:,} Personen")

                    save_state(
                        HUMAN_STATE_FILE_SORTED,
                        {
                            "lineNumber": current_line,
                            "processed": processed,
                            "humans": humans,
                            "updatedAt": datetime.now().isoformat(),
                        },
                    )

                    return

                processed += len(batch)

                if results:
                    append_records(
                        OUTPUT_FILE,
                        results,
                    )

                with open(
                    STATISTICS_FILE,
                    "w",
                    encoding="utf-8",
                ) as f:
                    json.dump(
                        stats,
                        f,
                        indent=2,
                        ensure_ascii=False,
                    )

                save_state(
                    STATE_FILE,
                    {
                        "lineNumber": current_line,
                        "processed": processed,
                        "humans": humans,
                        "updatedAt": datetime.now().isoformat(),
                    },
                )

                rate = humans / max(processed, 1) * 100

                print(
                    f"ln=[{current_line:,}] "
                    f"p=[{processed:,}] "
                    f"Menschen={humans:,} "
                    f"({rate:.2f}%) "
                    f"AL={last_article_length} "
                    f"{last_title}"
                )

                batch = []

            except Exception as err:

                response = getattr(
                    err,
                    "response",
                    None,
                )

                if (
                    response
                    and getattr(
                        response,
                        "status_code",
                        None,
                    )
                    == 429
                ):
                    retry_after = int(
                        response.headers.get(
                            "retry-after",
                            60,
                        )
                    )

                    print(f"429 erhalten. Warte {retry_after}s")

                    time.sleep(retry_after)

                    continue

                print(str(err))

                save_state(
                    HUMAN_STATE_FILE_SORTED,
                    {
                        "lineNumber": current_line,
                        "processed": processed,
                        "humans": humans,
                        "updatedAt": datetime.now().isoformat(),
                    },
                )

                break

    print("Human-Filter beendet.")


if __name__ == "__main__":
    run()
