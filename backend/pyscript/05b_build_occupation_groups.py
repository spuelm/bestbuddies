import json
import os
from datetime import datetime
from pylib.utils import measure_runtime
import pylib.config as cfg
from pylib.jsonl_writer import ensure_all_directories
from pylib.wiki_api import wdata_load_entities
from pylib.state_manager import load_state, save_state

INPUT_FILE = cfg.USED_OCCUPATIONS_FILE
CACHE_FILE = cfg.OCCUPATION_GROUP_CACHE_FILE
STATE_FILE = cfg.OCCUPATION_GROUP_STATE_FILE
ERROR_FILE = cfg.OCCUPATION_GROUP_ERRORS_FILE
TARGET_GROUPS = [
    {"name": "literat", "group": "Literatur"},
    {"name": "writer", "group": "Literatur"},
    {"name": "autor", "group": "Literatur"},
    {"name": "Musik", "group": "Musik"},
    {"name": "music", "group": "Musik"},
    {"name": "singer", "group": "Musik"},
    {"name": "composer", "group": "Musik"},
    {"name": "politik", "group": "Politik"},
    {"name": "politic", "group": "Politik"},
    {"name": "radikaler", "group": "Politik"},
    {"name": "bürgerrechtler", "group": "Politik"},
    {"name": "anführer", "group": "Politik"},
    {"name": "aktivist", "group": "Politik"},
    {"name": "herrschaft", "group": "Politik"},
    {"name": "regierung", "group": "Politik"},
    {"name": "beamter", "group": "Politik"},
    {"name": "bürgermeister", "group": "Politik"},
    {"name": "proprietor", "group": "Politik"},
    {"name": "gauleitung", "group": "Politik"},
    {"name": "herrscher", "group": "Politik"},
    {"name": "aristokrat", "group": "Politik"},
    {"name": "häuptling", "group": "Politik"},
    {"name": "samurai", "group": "Politik"},
    {"name": "regierend", "group": "Politik"},
    {"name": "adelstitel", "group": "Politik"},
    {"name": "prinzgemahl", "group": "Politik"},
    {"name": "landeshauptmann", "group": "Politik"},
    {"name": "philosoph", "group": "Philosophie"},
    {"name": "techni", "group": "Technik"},
    {"name": "informatiker", "group": "Technik"},
    {"name": "baumeister", "group": "Technik"},
    {"name": "orgelbauer", "group": "Technik"},
    {"name": "kunst", "group": "Künstler"},
    {"name": "künstler", "group": "Künstler"},
    {"name": "theater", "group": "Künstler"},
    {"name": "tanz", "group": "Künstler"},
    {"name": "fotograf", "group": "Künstler"},
    {"name": "photogra", "group": "Künstler"},
    {"name": "architekt", "group": "Künstler"},
    {"name": "interpret", "group": "Künstler"},
    {"name": "holzschnitzer", "group": "Künstler"},
    {"name": "töpfer", "group": "Künstler"},
    {"name": "kupferstecher", "group": "Künstler"},
    {"name": "religi", "group": "Religion"},
    {"name": "rabbi", "group": "Religion"},
    {"name": "bishop", "group": "Religion"},
    {"name": "islamic", "group": "Religion"},
    {"name": "mitropolit", "group": "Religion"},
    {"name": "theolog", "group": "Religion"},
    {"name": "milit", "group": "Militär"},
    {"name": "soldat", "group": "Militär"},
    {"name": "marschall", "group": "Militär"},
    {"name": "offizier", "group": "Militär"},
    {"name": "crusader", "group": "Militär"},
    {"name": "ritter", "group": "Militär"},
    {"name": "söldner", "group": "Militär"},
    {"name": "Sport", "group": "Sport"},
    {"name": "snooker", "group": "Sport"},
    {"name": "fußball", "group": "Sport"},
    {"name": "karambolage", "group": "Sport"},
    {"name": "billard", "group": "Sport"},
    {"name": "dart", "group": "Sport"},
    {"name": "pokerspieler", "group": "Sport"},
    {"name": "medizin", "group": "Medizin"},
    {"name": "medic", "group": "Medizin"},
    {"name": "arzt", "group": "Medizin"},
    {"name": "physicist", "group": "Medizin"},
    {"name": "schamane", "group": "Medizin"},
    {"name": "heiler", "group": "Medizin"},
    {"name": "heilpraktiker", "group": "Medizin"},
    {"name": "Wirtschaft", "group": "Wirtschaft"},
    {"name": "management", "group": "Wirtschaft"},
    {"name": "economy", "group": "Wirtschaft"},
    {"name": "unternehmer", "group": "Wirtschaft"},
    {"name": "bankier", "group": "Wirtschaft"},
    {"name": "banker", "group": "Wirtschaft"},
    {"name": "kaufmann", "group": "Wirtschaft"},
    {"name": "geschäftsmann", "group": "Wirtschaft"},
    {"name": "landwirt", "group": "Wirtschaft"},
    {"name": "wissenschaft", "group": "Wissenschaft"},
    {"name": "ingenieur", "group": "Wissenschaft"},
    {"name": "museum", "group": "Wissenschaft"},
    {"name": "profess", "group": "Wissenschaft"},
    {"name": "forsch", "group": "Wissenschaft"},
    {"name": "academi", "group": "Wissenschaft"},
    {"name": "physics", "group": "Wissenschaft"},
    {"name": "research", "group": "Wissenschaft"},
    {"name": "scienti", "group": "Wissenschaft"},
    {"name": "science", "group": "Wissenschaft"},
    {"name": "hochschullehrer", "group": "Wissenschaft"},
    {"name": "gelehrter", "group": "Wissenschaft"},
    {"name": "person", "group": "Person"},
    {"name": "fahrzeugführer", "group": "Person"},
    {"name": "art", "group": "Kunst"},
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
                    "clearname": node["rawlabel"],
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
        rawlabel = (
            entity.get("labels", {}).get("de", {}).get("value")
            or entity.get("labels", {}).get("en", {}).get("value")
            or ""
        )
        label = normalize(rawlabel)

        path_history.append({"qid": qid, "label": label, "rawlabel": rawlabel})
        print(f"Prüfe {qid}: {label}")
        match = next(
            (group for group in TARGET_GROUPS if group["name"] in label),
            None,
        )
        if match:
            for index, node in enumerate(path_history):
                cache[node["qid"]] = {
                    "label": node["label"],
                    "clearname": node["rawlabel"],
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
    ensure_all_directories()
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
