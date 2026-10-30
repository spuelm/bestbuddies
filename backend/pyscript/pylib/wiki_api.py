# wiki_api.py


from pylib.mediawiki_client import get_client, BOT_HEADER

# Wikidata Properties
P_POSITION_HELD = "P39"
P_BIRTH_YEAR = "P569"
P_DEATH_YEAR = "P570"
P_NATIONALITIES = "P27"
P_OCCUPATIONS = "P106"
P_GIVEN_NAMES = "P735"
P_FAMILY_NAMES = "P734"
P_BIRTH_PLACE = "P19"
P_CONTINENTS = "P30"


def wdata_load_entities(qids: list[str]) -> dict:
    """
    Lädt mehrere Wikidata-Entitäten auf einmal.
    """

    client = get_client()
    response = client.get(
        "https://www.wikidata.org/w/api.php",
        params={
            "action": "wbgetentities",
            "ids": "|".join(qids),
            "format": "json",
        },
        headers={
            "Api-User-Agent": BOT_HEADER,
        },
        timeout=30,
    )

    response.raise_for_status()
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
