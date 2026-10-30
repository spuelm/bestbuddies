import os
from dotenv import load_dotenv
import requests

load_dotenv()

BOT_HEADER = (
    "ZeitzeugenBot/1.0 "
    "(https://de.wikipedia.org/wiki/Benutzer:ZeitzeugenBot; "
    "s.puelm@gmx.de)"
)


WIKI_API = "https://de.wikipedia.org/w/api.php"

_client = None


def create_client():
    username = os.getenv("MEDIAWIKI_USERNAME")
    password = os.getenv("MEDIAWIKI_PASSWORD")

    print(username)

    if not username or not password:
        raise RuntimeError("MEDIAWIKI_USERNAME oder MEDIAWIKI_PASSWORD fehlt")

    session = requests.Session()
    session.headers.update({"User-Agent": BOT_HEADER})

    token_response = session.get(
        WIKI_API,
        params={"action": "query", "meta": "tokens", "type": "login", "format": "json"},
    )
    token_response.raise_for_status()

    login_token = token_response.json()["query"]["tokens"]["logintoken"]

    login_response = session.post(
        WIKI_API,
        data={
            "action": "login",
            "lgname": username,
            "lgpassword": password,
            "lgtoken": login_token,
            "format": "json",
        },
    )
    login_response.raise_for_status()

    print(login_response.json())

    result = login_response.json()["login"]["result"]

    if result != "Success":
        raise RuntimeError(f"Login fehlgeschlagen: {result}")

    print("Wikipedia Login erfolgreich")

    return session


def get_client():
    global _client

    if _client is None:
        _client = create_client()

    return _client
