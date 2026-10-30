import json
from datetime import datetime
from pathlib import Path







def save_state(
    state_file,
    gapcontinue,
    article_count,
    qid_count
):
    state_file = Path(state_file)

    state = {
        "gapcontinue": gapcontinue,
        "articleCount": article_count,
        "qidCount": qid_count,
        "updatedAt": datetime.utcnow().isoformat()
    }

    with open(state_file, "w", encoding="utf-8") as f:
        json.dump(
            state,
            f,
            indent=2,
            ensure_ascii=False
        )


def load_state(file):
    file = Path(file)

    if not file.exists():
        return {
            "gapcontinue": None,
            "articleCount": 0,
            "qidCount": 0
        }

    with open(file, "r", encoding="utf-8") as f:
        return json.load(f)
