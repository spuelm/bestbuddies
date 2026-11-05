import json

from pathlib import Path
from pylib.jsonl_writer import ensure_parent_directory
import pylib.config as cfg
from pylib.wiki_api import wdata_load_entities

INPUT_FILE = cfg.PERSONS_LINKSCORE_PASS2_FILE
CACHE_FILE = cfg.COUNTRY_CACHE_FILE
STATE_FILE = cfg.COUNTRY_STATE_FILE

BATCH_SIZE = 50
SAVE_INTERVAL = 100
MAX_DEPTH = 15


entity_cache: dict[str, dict | None] = {}


def load_cache_old() -> dict:
    if not Path(CACHE_FILE).exists():
        return {}
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_cache() -> dict:
    cache = {}

    if not Path(CACHE_FILE).exists():
        return cache

    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            entry = json.loads(line)
            cache[entry["placeId"]] = {
                "countryId": entry["countryId"],
                "countryName": entry["countryName"],
                "source": entry["source"],
                "depth": entry["depth"],
            }

    return cache


def append_cache_entry(
    place_id: str,
    result: dict,
) -> None:
    with open(CACHE_FILE, "a", encoding="utf-8") as f:
        f.write(
            json.dumps(
                {
                    "placeId": place_id,
                    **result,
                },
                ensure_ascii=False,
            )
        )
        f.write("\n")


def save_cache(cache: dict) -> None:
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(
            cache,
            f,
            ensure_ascii=False,
            indent=2,
        )


def load_state() -> int:
    if not Path(STATE_FILE).exists():
        return 0
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f).get("position", 0)


def save_state(position: int) -> None:
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {"position": position},
            f,
            ensure_ascii=False,
            indent=2,
        )


def get_entity(qid: str) -> dict | None:
    if not qid:
        return None
    if qid in entity_cache:
        return entity_cache[qid]
    entities = wdata_load_entities([qid])
    entity = entities.get(qid)
    entity_cache[qid] = entity
    return entity


def get_claim_qid(
    entity: dict,
    property_id: str,
) -> str | None:
    claims = entity.get("claims", {}).get(property_id)
    if not claims:
        return None
    for claim in claims:
        try:
            return claim["mainsnak"]["datavalue"]["value"]["id"]
        except Exception:
            pass
    return None


def get_label(entity: dict) -> str | None:

    labels = entity.get("labels", {})
    if "de" in labels:
        return labels["de"]["value"]
    if "en" in labels:
        return labels["en"]["value"]
    return None


def resolve_country(place_qid: str) -> dict:
    current_qid = place_qid
    visited = set()
    depth = 0
    while current_qid and depth <= MAX_DEPTH:
        if current_qid in visited:
            break
        visited.add(current_qid)
        entity = get_entity(current_qid)
        if not entity:
            break
        country_id = get_claim_qid(
            entity,
            "P17",
        )
        if country_id:
            country_entity = get_entity(country_id)
            return {
                "countryId": country_id,
                "countryName": (get_label(country_entity) if country_entity else None),
                "source": ("P17" if depth == 0 else "P131"),
                "depth": depth,
            }
        current_qid = get_claim_qid(
            entity,
            "P131",
        )
        depth += 1
    return {
        "countryId": None,
        "countryName": None,
        "source": None,
        "depth": depth,
    }


def collect_birthplaces() -> list[str]:
    birthplaces = set()
    with open(
        INPUT_FILE,
        "r",
        encoding="utf-8",
    ) as f:
        for line in f:
            record = json.loads(line)
            place_id = record.get("birthPlaceId")
            if place_id:
                birthplaces.add(place_id)
    return sorted(birthplaces)


def run():
    print(f"Inputfile:  {INPUT_FILE}")
    print(f"Statefile:  {STATE_FILE}")
    print(f"Cachefile:  {CACHE_FILE}")
    ensure_parent_directory(CACHE_FILE)
    ensure_parent_directory(STATE_FILE)
    cache = load_cache()
    birthplaces = collect_birthplaces()
    remaining = [place_id for place_id in birthplaces if place_id not in cache]
    restart_position = load_state()
    remaining = remaining[restart_position:]
    print(f"Birthplaces gesamt      : {len(birthplaces):,}")
    print(f"Bereits im Cache        : {len(cache):,}")
    print(f"Noch zu verarbeiten     : {len(remaining):,}")
    processed = 0
    for place_id in remaining:
        result = resolve_country(place_id)
        cache[place_id] = result
        append_cache_entry(
            place_id,
            result,
        )
        processed += 1
        save_state((processed))
        if processed % SAVE_INTERVAL == 0:
            print(f"Verarbeitet: " f"{processed:,}/" f"{len(birthplaces):,}")

    found = sum(1 for x in cache.values() if x["countryId"])
    missing = len(cache) - found
    print()
    print("Fertig")
    print(f"Cacheeinträge : {len(cache):,}")
    print(f"Land gefunden : {found:,}")
    print(f"Nicht gefunden: {missing:,}")


if __name__ == "__main__":
    run()
