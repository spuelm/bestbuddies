import requests
from lib.config import  BOT_HEADER


def fetch_batch(gapcontinue=None):
    params = {
        "action": "query",
        "generator": "allpages",
        "gaplimit": 500,
        "prop": "pageprops|info",
        "format": "json",
    }

    if gapcontinue:
        params["gapcontinue"] = gapcontinue

    response = requests.get(
        "https://de.wikipedia.org/w/api.php",
        params=params,
        headers={
            "User-Agent":BOT_HEADER
        },
        timeout=30,
    )

    response.raise_for_status()
    return response.json()
