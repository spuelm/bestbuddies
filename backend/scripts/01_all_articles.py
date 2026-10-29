import os
# @TODO liknshere PASS1 mit auslesen

from lib.config import (
    DATA_DIR,
    ALL_ARTICLES_FILE,
    ALL_ARTICLES_STATE_FILE,
    REQUEST_DELAY_MS,
    BOT_HEADER
)
from lib.sleep import sleepSeconds
from lib.wikipedia_api import fetch_batch
from lib.jsonl_writer import append_records
from lib.state_manager import load_state2, save_state2
from lib.progress import log_progress


async def run():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)

    state = load_state2(ALL_ARTICLES_STATE_FILE)

    gapcontinue = state.get("gapcontinue")
    article_count = state.get("articleCount", 0)
    qid_count = state.get("qidCount", 0)

    print(
        f"Fortsetzen bei {article_count:,}".replace(",", ".")
        + " Artikeln"
    )

    while True:
        try:
            data = await fetch_batch(gapcontinue)

            pages = list(data["query"]["pages"].values())
            records = []

            for page in pages:
                wikidata_id = (
                    page.get("pageprops", {})
                    .get("wikibase_item")
                )

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

            append_records(
                ALL_ARTICLES_FILE,
                records,
            )

            gapcontinue = (
                data.get("continue", {})
                .get("gapcontinue")
            )

            save_state2(
                ALL_ARTICLES_STATE_FILE,
                gapcontinue,
                article_count,
                qid_count,
            )

            log_progress(
                article_count,
                qid_count,
            )

            if not gapcontinue:
                print(
                    "Wikipedia vollständig verarbeitet."
                )
                break

            #await sleepSeconds(REQUEST_DELAY_MS/1000)

        except Exception as err:

            # requests/httpx Fehlerbehandlung
            response = getattr(err, "response", None)

            if (
                response is not None
                and response.status_code == 429
            ):
                retry_after = int(
                    response.headers.get(
                        "retry-after", 60
                    )
                )

                print(
                    f"429 erhalten. Warte {retry_after}s"
                )

                await sleepSeconds(retry_after)
                continue

            print(str(err))

            save_state2(
                ALL_ARTICLES_STATE_FILE,
                gapcontinue,
                article_count,
                qid_count,
            )

            break


if __name__ == "__main__":
    import asyncio

    try:
        asyncio.run(run())
        print("Crawler beendet.")
    except Exception as err:
        print("Fataler Fehler:")
        print(err)