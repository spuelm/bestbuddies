import json
import pylib.config as cfg

continents = {}

with open(cfg.CONTINENT_CACHE_FILE, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue

        entry = json.loads(line)

        continent_id = entry.get("continentId")
        continent_name = entry.get("continentName")

        if continent_id and continent_name:
            continents[continent_id] = continent_name

print("\nBekannte Kontinente:")
for continent_id, continent_name in sorted(continents.items(), key=lambda x: x[1]):
    print(f"{continent_id}: {continent_name}")

print(f"\nAnzahl Kontinente: {len(continents)}")
