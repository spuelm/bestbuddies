import json
import time
from pathlib import Path
import requests
import pylib.config as cfg
from pylib.mediawiki_client import get_client
from pylib.wiki_api import BOT_HEADER
from pylib.jsonl_writer import ensure_all_directories
from pylib.utils import measure_runtime

INPUT_FILE = cfg.RESULT_PHASE_2_FILE
OUTPUT_FILE = cfg.PERSONS_LINKSCORE_PASS1_FILE
STATE_FILE = cfg.PERSONS_LINKSCORE_PASS1_STATE_FILE
BATCH_SIZE = 10  # muss klein sein damit nicht zu viele hasmorelinks ausgelöst wwerden Bei 50 sind nur 2950 gefunden bei 10 bereits 928032
MAX_PERSONS = 5_000_000


def load_state():
    if not Path(STATE_FILE).exists():
        return {
            "lineNumber": 0,
            "processed": 0,
        }
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def query_batch(batch):
    while True:
        try:
            pageids = "|".join(str(person["pageid"]) for person in batch)
            client = get_client()
            response = client.get(
                "https://de.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "prop": "linkshere",
                    "pageids": pageids,
                    "lhlimit": "max",
                    "lhnamespace": 0,
                    "lhshow": "!redirect",
                    "format": "json",
                },
                headers={"User-Agent": BOT_HEADER},
                timeout=30,
            )
            response.raise_for_status()
            return response.json()
        except requests.HTTPError as err:
            if err.response is not None and err.response.status_code == 429:
                retry_after = int(err.response.headers.get("retry-after", 60))
                print(f"429 erhalten. Warte {retry_after}s")
                time.sleep(retry_after)
                continue
            raise


@measure_runtime
def run():
    print(f"Inputfile:  {INPUT_FILE}")
    print(f"Outputfile: {OUTPUT_FILE}")
    print(f"Statefile:  {STATE_FILE}")
    ensure_all_directories()
    state = load_state()
    start_line = state.get("lineNumber", 0)
    processed = state.get("processed", 0)
    mode = "a" if start_line > 0 else "w"
    print(f"Fortsetzen bei Zeile {start_line}")
    output = open(OUTPUT_FILE, mode, encoding="utf-8")
    try:
        batch = []
        line_number = 0
        with open(INPUT_FILE, "r", encoding="utf-8") as reader:
            for line in reader:
                line_number += 1
                if line_number <= start_line:
                    continue
                person = json.loads(line)
                batch.append(person)
                if len(batch) < BATCH_SIZE:
                    continue
                data = query_batch(batch)
                pages = data.get("query", {}).get("pages", {})
                has_more_links = "continue" in data
                for page in pages.values():
                    person = next(
                        (p for p in batch if p["title"] == page.get("title")),
                        None,
                    )
                    if not person:
                        continue
                    result = {**person, "linkScore": len(page.get("linkshere", []))}
                    result["hasMoreLinks"] = has_more_links
                    result["lhcontinue"] = (
                        data["continue"]["lhcontinue"] if has_more_links else None
                    )

                    output.write(json.dumps(result, ensure_ascii=False) + "\n")
                    processed += 1

                save_state(
                    {
                        "lineNumber": line_number,
                        "processed": processed,
                        "lastTitle": batch[-1]["title"],
                        "lastQid": batch[-1]["wikidataId"],
                        "updatedAt": __import__("datetime").datetime.now().isoformat(),
                    }
                )
                print(f"[{processed}]")
                batch = []
                if processed >= MAX_PERSONS:
                    break
    finally:
        output.close()
    print("Pass 1 beendet.")


if __name__ == "__main__":
    run()
