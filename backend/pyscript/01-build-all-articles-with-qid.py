from pathlib import Path
import asyncio

from pylib.config import (
    ALL_ARTICLES_FILE,
    ALL_ARTICLES_STATE_FILE,
)

from pylib.wiki_api import wpedia_fetch_batch
from pylib.jsonl_writer import append_records, ensure_parent_directory
from pylib.state_manager import load_state_old, save_state_old

# @TODO load_state_old, save_state_old ersetzen

INPUT_FILE = None
OUTPUT_FILE = ALL_ARTICLES_FILE
STATE_FILE = ALL_ARTICLES_STATE_FILE


def log_progress(article_count, qid_count):
    qid_rate = qid_count / max(article_count, 1) * 100

    print(f"{article_count:,} Artikel" f" | QIDs={qid_count:,}" f" | {qid_rate:.2f}%")


def run():
    print(f"Inputfile:  {INPUT_FILE}")
    print(f"Outputfile: {OUTPUT_FILE}")
    print(f"Statefile:  {STATE_FILE}")
    ensure_parent_directory(OUTPUT_FILE)
    ensure_parent_directory(STATE_FILE)

    state = load_state_old(STATE_FILE)

    gapcontinue = state.get("gapcontinue")
    article_count = state.get("articleCount", 0)
    qid_count = state.get("qidCount", 0)

    print(f"Fortsetzen bei {article_count:,} Artikeln".replace(",", "."))

    while True:
        try:
            data = wpedia_fetch_batch(gapcontinue)

            pages = list(data["query"]["pages"].values())

            records = []

            for page in pages:
                wikidata_id = page.get("pageprops", {}).get("wikibase_item")

                if wikidata_id:
                    qid_count += 1
                records.append(
                    {
                        "pageid": page["pageid"],
                        "ns": page["ns"],
                        "title": page["title"],
                        "wikidataId": wikidata_id,
                        "hasQid": wikidata_id is not None,
                        "articleLength": page.get("length", 0),
                    }
                )

                article_count += 1

            append_records(OUTPUT_FILE, records)

            gapcontinue = data.get("continue", {}).get("gapcontinue")

            save_state_old(STATE_FILE, gapcontinue, article_count, qid_count)

            log_progress(article_count, qid_count)

            if not gapcontinue:
                print("Wikipedia vollständig verarbeitet.")
                break

        except Exception as err:
            status_code = getattr(getattr(err, "response", None), "status_code", None)

            if status_code == 429:
                retry_after = int(
                    getattr(err.response, "headers", {}).get("retry-after", 60)
                )

                print(f"429 erhalten. Warte {retry_after}s")
                asyncio.sleep(retry_after)
                continue

            print(str(err))

            save_state_old(STATE_FILE, gapcontinue, article_count, qid_count)

            break


if __name__ == "__main__":
    import asyncio

    try:
        run()
        print("Crawler beendet.")
    except Exception as err:
        print("Fataler Fehler:")
        print(err)
