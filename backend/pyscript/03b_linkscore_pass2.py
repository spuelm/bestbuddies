import json
import time
from datetime import datetime
import traceback

import requests
from pylib.config import (
    PERSONS_LINKSCORE_PASS1_FILE,
    PERSONS_LINKSCORE_PASS2_FILE,
    PERSONS_LINKSCORE_PASS2_STATE_FILE,
)
from pylib.mediawiki_client import get_client, BOT_HEADER
from pylib.jsonl_writer import ensure_all_directories
from pylib.utils import ORANGE, measure_runtime, printcolor, RED, GREEN, RESET

INPUT_FILE = PERSONS_LINKSCORE_PASS1_FILE
OUTPUT_FILE = PERSONS_LINKSCORE_PASS2_FILE
STATE_FILE = PERSONS_LINKSCORE_PASS2_STATE_FILE
MAX_PERSONS = 5_000_000


def load_state():
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "lineNumber": 0,
            "processed": 0,
        }


def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def get_link_score(pageid: str) -> int:
    total_links = 0
    lhcontinue = None
    while True:
        params = {
            "action": "query",
            "prop": "linkshere",
            "pageids": str(pageid),
            "lhlimit": "max",
            "lhshow": "!redirect",
            "lhnamespace": 0,
            "format": "json",
        }
        if lhcontinue:
            params["lhcontinue"] = lhcontinue
        try:
            client = get_client()
            response = client.get(
                "https://de.wikipedia.org/w/api.php",
                params=params,
                headers={
                    "User-Agent": BOT_HEADER,
                },
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            pages = data.get("query", {}).get("pages", {})
            page = next(iter(pages.values()), None)
            if page is None:
                return total_links
            links = page.get("linkshere", [])
            valid_links = [link for link in links if not link.get("redirect", False)]
            total_links += len(valid_links)
            continuation = data.get("continue")
            if not continuation:
                return total_links
            lhcontinue = continuation.get("lhcontinue")
        except requests.exceptions.HTTPError as exc:
            status = exc.response.status_code
            if status == 429:
                retry_after = int(exc.response.headers.get("Retry-After", 60))
                printcolor(
                    f"Fehler 429. Warte {retry_after}s",
                    color=ORANGE,
                )
                time.sleep(retry_after)
                continue
            raise
        except Exception:
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
    print(f"Fortsetzen bei Zeile {start_line:,}".replace(",", "."))
    output_mode = "a" if start_line > 0 else "w"
    with open(INPUT_FILE, "r", encoding="utf-8") as infile, open(
        OUTPUT_FILE, output_mode, encoding="utf-8"
    ) as outfile:
        line_number = 0
        for line in infile:
            line_number += 1
            if line_number <= start_line:
                continue
            if processed >= MAX_PERSONS:
                print(f"Limit {MAX_PERSONS:,}".replace(",", ".") + " erreicht")
                break
            person = json.loads(line)
            person["state_pas2"] = "copy"
            try:
                new_score = 0
                old_score = person.get("linkScore", 0)

                hasMoreLinks = person.get("hasMoreLinks", False)
                if hasMoreLinks:
                    person["state_pas2"] = "score_error"
                    new_score = get_link_score(str(person["pageid"]))
                    person["state_pas2"] = "new_score"
                    person["linkScore"] = new_score
                    if new_score > 0:
                        person["hasMoreLinks"] = False
                    print(
                        f"{GREEN if new_score > 500 else RESET}" + f"[{processed:,}] "
                        f"{person['title']} "
                        f"articlelen: "
                        f"{person.get('articleLength', 0)} "
                        f"→ {old_score} → {person['linkScore']}   " + RESET
                    )

                outfile.write(
                    json.dumps(
                        person,
                        ensure_ascii=False,
                    )
                    + "\n"
                )
                processed += 1
                save_state(
                    {
                        "lineNumber": line_number,
                        "processed": processed,
                        "lastQid": person.get("wikidataId"),
                        "lastTitle": person.get("title"),
                        "updatedAt": datetime.now().isoformat(),
                    }
                )
                if processed % 500 == 0:
                    print(
                        f"[{processed:,}] "
                        f"{person['title']} "
                        f"articlelen: "
                        f"{person.get('articleLength', 0)} "
                        f"→ Linkscore={person['linkScore']}"
                    )
            except Exception as exc:
                printcolor(
                    f"Fehler bei " f"{person.get('title', '<unbekannt>')}: " f"{exc}",
                    color=RED,
                )
                traceback.print_exc()
                save_state(
                    {
                        "lineNumber": line_number - 1,
                        "processed": processed,
                        "lastQid": person.get("wikidataId"),
                        "lastTitle": person.get("title"),
                        "updatedAt": datetime.now().isoformat(),
                    }
                )
    save_state(
        {
            "lineNumber": line_number,
            "processed": processed,
            "updatedAt": datetime.now().isoformat(),
        }
    )
    print("Linkscore-Ermittlung beendet.")


if __name__ == "__main__":
    run()
