import json
import os
import time
from datetime import datetime
from pylib.utils import measure_runtime
import pylib.config as cfg
from pylib.jsonl_writer import ensure_parent_directory

from pylib.wiki_api import wdata_load_entities
from pylib.state_manager import load_state, save_state

INPUT_FILE = cfg.USED_OCCUPATIONS_FILE
CACHE_FILE = cfg.OCCUPATION_GROUP_CACHE_FILE
STATE_FILE = cfg.OCCUPATION_GROUP_STATE_FILE
ERROR_FILE = cfg.OCCUPATION_GROUP_ERRORS_FILE
TARGET_GROUPS = [
    {"name": "literat", "group": "literatur"},
    {"name": "writer", "group": "literatur"},
    {"name": "autor", "group": "literatur"},
    {"name": "musik", "group": "musik"},
    {"name": "music", "group": "musik"},
    {"name": "singer", "group": "musik"},
    {"name": "composer", "group": "musik"},
    {"name": "politik", "group": "politik"},
    {"name": "politic", "group": "politik"},
    {"name": "radikaler", "group": "politik"},
    {"name": "bürgerrechtler", "group": "politik"},
    {"name": "anführer", "group": "politik"},
    {"name": "aktivist", "group": "politik"},
    {"name": "herrschaft", "group": "politik"},
    {"name": "regierung", "group": "politik"},
    {"name": "beamter", "group": "politik"},
    {"name": "bürgermeister", "group": "politik"},
    {"name": "proprietor", "group": "politik"},
    {"name": "gauleitung", "group": "politik"},
    {"name": "herrscher", "group": "politik"},
    {"name": "aristokrat", "group": "politik"},
    {"name": "häuptling", "group": "politik"},
    {"name": "samurai", "group": "politik"},
    {"name": "regierend", "group": "politik"},
    {"name": "adelstitel", "group": "politik"},
    {"name": "prinzgemahl", "group": "politik"},
    {"name": "landeshauptmann", "group": "politik"},
    {"name": "philosoph", "group": "philosophie"},
    {"name": "techni", "group": "technik"},
    {"name": "informatiker", "group": "technik"},
    {"name": "baumeister", "group": "technik"},
    {"name": "orgelbauer", "group": "technik"},
    {"name": "kunst", "group": "künstler"},
    {"name": "künstler", "group": "künstler"},
    {"name": "theater", "group": "künstler"},
    {"name": "tanz", "group": "künstler"},
    {"name": "fotograf", "group": "künstler"},
    {"name": "photogra", "group": "künstler"},
    {"name": "architekt", "group": "künstler"},
    {"name": "interpret", "group": "künstler"},
    {"name": "holzschnitzer", "group": "künstler"},
    {"name": "töpfer", "group": "künstler"},
    {"name": "kupferstecher", "group": "künstler"},
    {"name": "religi", "group": "religion"},
    {"name": "rabbi", "group": "religion"},
    {"name": "bishop", "group": "religion"},
    {"name": "islamic", "group": "religion"},
    {"name": "mitropolit", "group": "religion"},
    {"name": "theolog", "group": "religion"},
    {"name": "milit", "group": "militär"},
    {"name": "soldat", "group": "militär"},
    {"name": "marschall", "group": "militär"},
    {"name": "offizier", "group": "militär"},
    {"name": "crusader", "group": "militär"},
    {"name": "ritter", "group": "militär"},
    {"name": "söldner", "group": "militär"},
    {"name": "sport", "group": "sport"},
    {"name": "snooker", "group": "sport"},
    {"name": "fußball", "group": "sport"},
    {"name": "karambolage", "group": "sport"},
    {"name": "billard", "group": "sport"},
    {"name": "dart", "group": "sport"},
    {"name": "pokerspieler", "group": "sport"},
    {"name": "medizin", "group": "medizin"},
    {"name": "medic", "group": "medizin"},
    {"name": "arzt", "group": "medizin"},
    {"name": "physicist", "group": "medizin"},
    {"name": "wirtschaft", "group": "wirtschaft"},
    {"name": "management", "group": "wirtschaft"},
    {"name": "economy", "group": "wirtschaft"},
    {"name": "unternehmer", "group": "wirtschaft"},
    {"name": "bankier", "group": "wirtschaft"},
    {"name": "banker", "group": "wirtschaft"},
    {"name": "kaufmann", "group": "wirtschaft"},
    {"name": "geschäftsmann", "group": "wirtschaft"},
    {"name": "landwirt", "group": "wirtschaft"},
    {"name": "wissenschaft", "group": "wissenschaft"},
    {"name": "ingenieur", "group": "wissenschaft"},
    {"name": "museum", "group": "wissenschaft"},
    {"name": "profess", "group": "wissenschaft"},
    {"name": "forsch", "group": "wissenschaft"},
    {"name": "academi", "group": "wissenschaft"},
    {"name": "physics", "group": "wissenschaft"},
    {"name": "research", "group": "wissenschaft"},
    {"name": "scienti", "group": "wissenschaft"},
    {"name": "science", "group": "wissenschaft"},
    {"name": "hochschullehrer", "group": "wissenschaft"},
    {"name": "gelehrter", "group": "wissenschaft"},
    {"name": "person", "group": "person"},
    {"name": "fahrzeugführer", "group": "person"},
    {"name": "art", "group": "kunst"},
]


def normalize(text):
    return (text or "").lower().strip()


def append_error(data):
    with open(ERROR_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False) + "\n")


def load_entity_with_retry(qid):
    while True:
            entities = wdata_load_entities([qid])
            entity = entities.get(qid)
            if not entity:
                raise RuntimeError(f"Entity fehlt: {qid}")
            return entity
    

def resolve_group(start_qid, cache):
    if start_qid in cache:
        return cache[start_qid]["group"]
    queue = [start_qid]
    visited = set()
    path_history = []
    while queue:
        qid = queue.pop(0)
        if qid in visited:
            continue
        visited.add(qid)
        if qid in cache:
            cached_group = cache[qid]["group"]
            for index, node in enumerate(path_history):
                cache[node["qid"]] = {
                    "label": node["label"],
                    "group": cached_group,
                    "resolvedVia": cache[qid].get("resolvedVia"),
                    "resolvedViaQid": cache[qid].get("resolvedViaQid"),
                    "index": index,
                }
            return cached_group
        try:
            entity = load_entity_with_retry(qid)
        except Exception as err:
            append_error({"qid": qid, "error": str(err)})
            continue
        label = normalize(
            entity.get("labels", {}).get("de", {}).get("value")
            or entity.get("labels", {}).get("en", {}).get("value")
            or ""
        )
        path_history.append({"qid": qid, "label": label})
        print(f"Prüfe {qid}: {label}")
        match = next(
            (group for group in TARGET_GROUPS if group["name"] in label),
            None,
        )
        if match:
            for index, node in enumerate(path_history):
                cache[node["qid"]] = {
                    "label": node["label"],
                    "group": match["group"],
                    "resolvedVia": label,
                    "resolvedViaQid": qid,
                    "index": index,
                }
            return match["group"]
        parents = entity.get("claims", {}).get("P279", [])
        if not parents:
            break
        parent_qid = (
            parents[0]
            .get("mainsnak", {})
            .get("datavalue", {})
            .get("value", {})
            .get("id")
        )
        if not parent_qid:
            break
        queue.append(parent_qid)
    for index, node in enumerate(path_history):
        cache[node["qid"]] = {
            "label": node["label"],
            "group": "nicht gefunden",
            "resolvedVia": None,
            "resolvedViaQid": None,
            "index": index,
        }
    return "nicht gefunden"


@measure_runtime
def run():
    print(f"Inputfile:  {INPUT_FILE}")
    print(f"Outputfile: {CACHE_FILE}")
    print(f"Statefile:  {STATE_FILE}")
    print(f"Errorfile:  {ERROR_FILE}")
    ensure_parent_directory(CACHE_FILE)
    ensure_parent_directory(STATE_FILE)
    ensure_parent_directory(ERROR_FILE)
    cache = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cache = json.load(f)
    state = load_state(STATE_FILE)
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        occupations = json.load(f)
    occupation_ids = [item["occupationId"] for item in occupations]
    occupations_to_process = sorted(qid for qid in occupation_ids if qid not in cache)
    start_index = 0
    last_occupation_id = state.get("lastOccupationId")
    if last_occupation_id:
        try:
            idx = occupations_to_process.index(last_occupation_id)
            start_index = idx + 1
        except ValueError:
            pass
    processed = state.get("processed", 0)
    print(f"{len(occupations_to_process):,}".replace(",", "."), "neue Berufe")
    for i in range(start_index, len(occupations_to_process)):
        occupation_id = occupations_to_process[i]
        try:
            group = resolve_group(occupation_id, cache)
            processed += 1
            current = i + 1
            print(
                "current=",
                current,
                "processed=",
                processed,
                "occupationId=",
                occupation_id,
                "group=",
                group,
            )
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False, indent=2)
            save_state(
                STATE_FILE,
                {
                    "processed": processed,
                    "lastOccupationId": occupation_id,
                    "updatedAt": datetime.utcnow().isoformat(),
                },
            )
            print(f"{processed}/{len(occupations_to_process)}")
            print(occupation_id, "→", group)
        except Exception as err:
            append_error(
                {
                    "qid": occupation_id,
                    "error": str(err),
                    "updatedAt": datetime.utcnow().isoformat(),
                }
            )
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False, indent=2)
            save_state(
                STATE_FILE,
                {
                    "processed": processed,
                    "lastOccupationId": occupation_id,
                    "updatedAt": datetime.utcnow().isoformat(),
                },
            )
            print(f"FEHLER {occupation_id}: {err}")
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    if occupations_to_process:
        save_state(
            STATE_FILE,
            {
                "processed": processed,
                "lastOccupationId": occupations_to_process[-1],
                "updatedAt": datetime.utcnow().isoformat(),
            },
        )
    print("Fertig.")


if __name__ == "__main__":
    run()
