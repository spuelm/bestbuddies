import json
from backend.pyscript.pylib.jsonl_writer import ensure_parent_directory
from backend.pyscript.pylib.utils import measure_runtime
import pylib.config as cfg

INPUT_FILE = cfg.RESULT_PHASE_3_FILE
OUTPUT_FILE = cfg.PERSONS_WITH_LOCATION_FILE
COUNTRY_CACHE_FILE = cfg.COUNTRY_CACHE_FILE
CONTINENT_CACHE_FILE = cfg.CONTINENT_CACHE_FILE


def load_country_cache():
    cache = {}

    with open(COUNTRY_CACHE_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue

            row = json.loads(line)

            place_id = row.get("placeId")
            if place_id:
                cache[place_id] = {
                    "countryId": row.get("countryId"),
                    "countryName": row.get("countryName"),
                }

    print(f"Country Cache: {len(cache):,} Einträge")
    return cache


def load_continent_cache():
    cache = {}

    with open(CONTINENT_CACHE_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue

            row = json.loads(line)

            country_id = row.get("countryId")
            if country_id:
                cache[country_id] = {
                    "continentId": row.get("continentId"),
                    "continentName": row.get("continentName"),
                }

    print(f"Continent Cache: {len(cache):,} Einträge")
    return cache


@measure_runtime
def run():
    print(f"Inputfile:  {INPUT_FILE}")
    print(f"COUNTRY_CACHE_FILE: {COUNTRY_CACHE_FILE}")
    print(f"CONTINENT_CACHE_FILE: {CONTINENT_CACHE_FILE}")
    ensure_parent_directory(OUTPUT_FILE)

    country_cache = load_country_cache()
    continent_cache = load_continent_cache()

    processed = 0
    country_hits = 0
    continent_hits = 0

    with open(INPUT_FILE, "r", encoding="utf-8") as fin, open(
        OUTPUT_FILE, "w", encoding="utf-8"
    ) as fout:

        for line in fin:
            if not line.strip():
                continue

            person = json.loads(line)
            processed += 1
            del person["state_pas2"]
            del person["hasMoreLinks"]
            del person["lhcontinue"]
            birth_place_id = person.get("birthPlaceId")

            if birth_place_id:

                country = country_cache.get(birth_place_id)

                if country:
                    person["countryId"] = country["countryId"]
                    person["countryName"] = country["countryName"]

                    country_hits += 1

                    continent = continent_cache.get(country["countryId"])

                    if continent:
                        person["continentId"] = continent["continentId"]
                        person["continentName"] = continent["continentName"]

                        continent_hits += 1

            fout.write(json.dumps(person, ensure_ascii=False) + "\n")

    print()
    print(f"Verarbeitet     : {processed:,}")
    print(f"Country Treffer : {country_hits:,}")
    print(f"Continent Treffer: {continent_hits:,}")
    print(f"Ausgabe         : {OUTPUT_FILE}")


if __name__ == "__main__":
    run()
