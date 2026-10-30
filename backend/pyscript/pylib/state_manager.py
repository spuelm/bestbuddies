import json
from datetime import datetime
from pathlib import Path


def load_state(state_file):
    file = Path(state_file)
    if not file.exists():
        return {"lineNumber": 0, "processed": 0, "humans": 0, "updatedAt": None}
    with open(file, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state_file, state):
    file = Path(state_file)
    with open(file, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def save_state_old(state_file, gapcontinue, article_count, qid_count):
    state_file = Path(state_file)

    state = {
        "gapcontinue": gapcontinue,
        "articleCount": article_count,
        "qidCount": qid_count,
        "updatedAt": datetime.utcnow().isoformat(),
    }

    with open(state_file, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def load_state_old(file):
    file = Path(file)

    if not file.exists():
        return {"gapcontinue": None, "articleCount": 0, "qidCount": 0}

    with open(file, "r", encoding="utf-8") as f:
        return json.load(f)
