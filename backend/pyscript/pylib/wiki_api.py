# wiki_api.py
import time
from urllib import response

import requests

from pylib.mediawiki_client import get_client, BOT_HEADER
from pylib.utils import ORANGE, printcolor

# Wikidata Properties
P_POSITION_HELT = "P39"
P_BIRTH_YEAR = "P569"
P_DEATH_YEAR = "P570"
P_NATIONALITIES = "P27"
P_OCCUPATIONS = "P106"
P_GIVEN_NAMES = "P735"
P_FAMILY_NAMES = "P734"
P_BIRTH_PLACE = "P19"
P_COUNTRY = "P17"
P_CONTINENTS = "P30"
CONTINENT_NAMES = {
    "Q15": "Afrika",
    "Q18": "Südamerika",
    "Q46": "Europa",
    "Q48": "Asien",
    "Q49": "Nordamerika",
    "Q51": "Antarktika",
    "Q538": "Ozeanien",
}

RETRYS = 3


def wdata_load_entities(qids: list[str]) -> dict:
    """
    Lädt mehrere Wikidata-Entitäten auf einmal.
    """
    for attempt in range(RETRYS):
        try:
            client = get_client()
            response = client.get(
                "https://www.wikidata.org/w/api.php",
                params={
                    "action": "wbgetentities",
                    "ids": "|".join(qids),
                    "format": "json",
                    "languages": "de|en",
                },
                headers={
                    "Api-User-Agent": BOT_HEADER,
                },
                timeout=30,
            )
            response.raise_for_status()
            return response.json().get("entities", {})
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

    return response.json().get("entities", {})


def wpedia_fetch_batch(gapcontinue: str | None = None) -> dict:
    """
    Lädt einen Batch deutscher Wikipedia-Seiten.
    """
    params = {
        "action": "query",
        "generator": "allpages",
        "gaplimit": 500,
        "prop": "pageprops|info",
        "format": "json",
    }
    if gapcontinue:
        params["gapcontinue"] = gapcontinue
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
    return response.json()
