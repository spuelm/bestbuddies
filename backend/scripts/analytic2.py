import pandas as pd
import numpy as np

datadir="C:/Users/steph/OneDrive/Projekte/Bestbuddies/git/bestbuddies/backend/data"


person_file=datadir+"/05_dataenrichment/05a_dataenrichment.jsonl"
occupation_file=datadir+"/06_occupation/06b_occupation-group-cache.json"
error_file=datadir+"/06_occupation/analytic_error.jsonl"



import json

# Occupations laden
with open(occupation_file, "r", encoding="utf-8") as f:
    occupations = json.load(f)

# Zulässige Occupation-IDs bestimmen
valid_occupations = {
    qid
    for qid, data in occupations.items()
    if data.get("group") not in {"person", "nicht gefunden"}
}


count = 0
max_linkscore =-1
max_articlelen = -1
no_occ =0

with open(person_file, "r", encoding="utf-8") as f, \
     open(error_file, "w", encoding="utf-8") as ferr:
    for line in f:
        person = json.loads(line)

        occupation_ids = person.get("occupationIds", [])
        if len (occupation_ids) == 0:
           no_occ += 1 
        else: 
            if not any(qid in valid_occupations for qid in occupation_ids):
                count += 1
                max_linkscore = max(max_linkscore, person["linkScore"])
                max_articlelen = max (max_articlelen, person["articleLength"])
                ferr.write(json.dumps(person, ensure_ascii=False) + "\n")
                print(
                    person["wikidataId"],
                    person["title"]
                )
# Datei laden
with open(error_file, "r", encoding="utf-8") as f:
    persons = [json.loads(line) for line in f]

# Nach linkScore absteigend sortieren
persons.sort(key=lambda p: p.get("linkScore", 0), reverse=True)

# Zurückschreiben
with open(error_file, "w", encoding="utf-8") as f:
    for person in persons:
        f.write(json.dumps(person, ensure_ascii=False) + "\n")

print(f"{len(persons)} Datensätze sortiert.")

import json

# Occupations laden (ohne Filter)
with open(occupation_file, "r", encoding="utf-8") as f:
    occupations = json.load(f)

persons = []

# Error-Datei laden
with open(error_file, "r", encoding="utf-8") as f:
    for line in f:
        person = json.loads(line)

        occ_ids = person.get("occupationIds", [])

        if occ_ids:
            first_qid = occ_ids[0]

            if first_qid in occupations:
                person["occupationIds"][0] = occupations[first_qid]["label"]

        persons.append(person)

# Zurückschreiben
with open(error_file, "w", encoding="utf-8") as f:
    for person in persons:
        f.write(json.dumps(person, ensure_ascii=False) + "\n")

print(f"{len(persons)} Datensätze aktualisiert.")
print(f"\nGefundene Personen: {count}")
print(f"max articlelength {max_articlelen}")
print(f"max linkscore {max_linkscore}")
print (f"no_occ {no_occ}")


import pandas as pd
from collections import Counter

# JSONL laden
df = pd.read_json(error_file, lines=True)

# Erstes Element jeder Liste extrahieren
first_ids = df["occupationIds"].apply(
    lambda x: x[0] if isinstance(x, list) and len(x) > 0 else None
)

# Häufigkeiten zählen
counts = first_ids.value_counts()

print(counts)

