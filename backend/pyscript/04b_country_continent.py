import json
from pathlib import Path
from backend.pyscript.pylib.utils import measure_runtime
import pylib.config as cfg
from pylib.wiki_api import wdata_load_entities

INPUT_FILE = cfg.COUNTRY_CACHE_FILE
OUTPUT_FILE = cfg.CONTINENT_CACHE_FILE
BATCH_SIZE = 50
entity_cache: dict[str, dict | None] = {}


def get_entity(qid: str) -> dict | None:
    if not qid:
        return None
    if qid in entity_cache:
        return entity_cache[qid]
    entities = wdata_load_entities([qid])
    entity = entities.get(qid)
    entity_cache[qid] = entity
    return entity


def get_label(entity: dict | None) -> str | None:
    if not entity:
        return None
    labels = entity.get("labels", {})
    if "de" in labels:
        return labels["de"]["value"]
    if "en" in labels:
        return labels["en"]["value"]
    return None


def get_claim_qid(
    entity: dict | None,
    property_id: str,
) -> str | None:
    if not entity:
        return None
    claims = entity.get("claims", {}).get(property_id)
    if not claims:
        return None
    for claim in claims:
        try:
            return claim["mainsnak"]["datavalue"]["value"]["id"]
        except Exception:
            pass
    return None


def load_country_cache() -> dict[str, dict]:
    result = {}
    if not Path(INPUT_FILE).exists():
        return result
    with open(
        INPUT_FILE,
        "r",
        encoding="utf-8",
    ) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            country_id = record.get("countryId")
            if country_id:
                result[country_id] = {
                    "countryName": record.get("countryName"),
                }
    return result


def batch_load_entities(
    qids: list[str],
) -> None:
    for i in range(0, len(qids), BATCH_SIZE):
        batch = qids[i : i + BATCH_SIZE]
        entities = wdata_load_entities(batch)
        for qid, entity in entities.items():
            entity_cache[qid] = entity
        print(
            f"Entities geladen: "
            f"{min(i + BATCH_SIZE, len(qids)):,}/"
            f"{len(qids):,}"
        )


def write_jsonl(
    filename: str,
    record: dict,
) -> None:
    with open(
        filename,
        "a",
        encoding="utf-8",
    ) as f:
        json.dump(
            record,
            f,
            ensure_ascii=False,
        )
        f.write("\n")


def correct_continent(
    country_name: str, continent_id: str, continent: str
) -> tuple[str, str]:
    if continent_id == "Q5401":
        if "russ" in country_name.lower():
            return "Q46", "Europa"
        else:
            return "Q48", "Asien"
    if continent_id == "Q55643":
        continent_id = "Q538"  # nur ein ozeanien
    if continent_id == "Q5401":
        continent_id = "Q48"  # nur ein Asien
    if continent_id == "Q27611":
        continent_id = "Q18"  # panama nach südamerika
        continent = "Südamerika"

    return continent_id, continent


@measure_runtime
def run() -> None:
    countries = load_country_cache()
    country_ids = sorted(countries.keys())
    print(f"Länder gefunden: {len(country_ids):,}")
    batch_load_entities(country_ids)
    continent_ids = set()
    for country_id in country_ids:
        entity = entity_cache.get(country_id)
        continent_id = get_claim_qid(
            entity,
            "P30",
        )
        if continent_id:
            continent_ids.add(continent_id)
    print(f"Kontinente gefunden: " f"{len(continent_ids):,}")
    batch_load_entities(sorted(continent_ids))
    output_file = Path(OUTPUT_FILE)
    if output_file.exists():
        output_file.unlink()
    processed = 0
    for country_id in country_ids:
        country_entity = entity_cache.get(country_id)
        continent_id = get_claim_qid(
            country_entity,
            "P30",
        )
        continent_name = None
        if continent_id:
            continent_entity = entity_cache.get(continent_id)
            continent_name = get_label(continent_entity)
            country_name = countries[country_id]["countryName"]
            continent_id, continent_name = correct_continent(
                country_name, continent_id, continent_name
            )
        write_jsonl(
            OUTPUT_FILE,
            {
                "countryId": country_id,
                "countryName": countries[country_id]["countryName"],
                "continentId": continent_id,
                "continentName": continent_name,
            },
        )
        processed += 1
        if processed % 100 == 0:
            print(f"{processed:,}/" f"{len(country_ids):,}")

    print()
    print("Fertig")
    print(f"Datei geschrieben: " f"{OUTPUT_FILE}")


if __name__ == "__main__":
    run()
