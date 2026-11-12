# Laufzeit ca. 2 Tage
import json
import os
import time
from datetime import datetime
from pylib.utils import measure_runtime
import pylib.wiki_api as wiki
from pylib.state_manager import load_state, save_state
from pylib.jsonl_writer import append_records, ensure_all_directories
import pylib.config as cfg

MAX_HUMANS = 5_000_000
INPUT_FILE = cfg.RESULT_PHASE_1_FILE
OUTPUT_FILE = cfg.PERSON_FILE
STATE_FILE = cfg.PERSON_STATE_FILE
STATISTICS_FILE = cfg.P31_STATS_FILE
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


def get_entity_ids_with_refcount(claims, property_id):
    values = claims.get(property_id, [])
    result = []
    for item in values:
        try:
            qid = item["mainsnak"]["datavalue"]["value"]["id"]
            result.append(
                {
                    "id": qid,
                    "references": len(item.get("references", [])),
                    "rank": item.get("rank", "normal"),
                }
            )
        except (KeyError, TypeError):
            pass
    return result


def process_batch(batch, stats):
    global last_title, last_article_length
    qids = [item["wikidataId"] for item in batch]
    while True:
        entities = wiki.wdata_load_entities(qids)
        if not isinstance(entities, dict):
            raise RuntimeError("Keine gültigen Entities erhalten")
        break
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
            wiki.P_BIRTH_YEAR,
        )
        death_year = get_year(
            claims,
            wiki.P_DEATH_YEAR,
        )
        if (birth_year is None) and (
            death_year is None
        ):  # humans must have at lease a birthday or a deathday, otherwise they are not humans
            continue
        nationality_ids = get_entity_ids(
            claims,
            wiki.P_NATIONALITIES,
        )
        occupation_ids = get_entity_ids_with_refcount(
            claims,
            wiki.P_OCCUPATIONS,
        )
        positions_held = get_entity_ids_with_refcount(
            claims,
            wiki.P_POSITION_HELD,
        )
        given_name_ids = get_entity_ids(
            claims,
            wiki.P_GIVEN_NAMES,
        )
        family_name_ids = get_entity_ids(
            claims,
            wiki.P_FAMILY_NAMES,
        )
        birth_place_id = get_single_entity_id(
            claims,
            wiki.P_BIRTH_PLACE,
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


@measure_runtime
def run():
    print(f"Inputfile:  {INPUT_FILE}")
    print(f"Outputfile: {OUTPUT_FILE}")
    print(f"Statefile:  {STATE_FILE}")
    print(f"Statefile:  {STATISTICS_FILE}")
    ensure_all_directories()
    state = load_state(STATE_FILE)
    print(state)
    stats = {}
    if os.path.exists(STATISTICS_FILE):
        with open(
            STATISTICS_FILE,
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
                        STATE_FILE,
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
                    STATE_FILE,
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
