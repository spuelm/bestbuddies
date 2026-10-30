from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / "data_p"
DATA_DIR = Path ("C:/Users/steph/OneDrive/Projekte/Bestbuddies/git/bestbuddies/backend/data_p")

ALL_ARTICLES = "01"
PERSON_CANDIDATES = "02"
PERSON_WITH_LINKS = "04"
PERSON_DATA_ENRICHMENT = "05"
OCCUPATION = "06"
PERSON_WITH_CENTURIES = "07"

REQUEST_DELAY_S = 3

# Phase 1: Get all articles with QID
ALL_ARTICLES_DIR = "_all_articles"
ALL_ARTICLES_FILE = (
    DATA_DIR / f"{ALL_ARTICLES}{ALL_ARTICLES_DIR}" / f"{ALL_ARTICLES}_all_articles_with_qid.jsonl"
)

ALL_ARTICLES_STATE_FILE = (
    DATA_DIR / f"{ALL_ARTICLES}{ALL_ARTICLES_DIR}" / f"{ALL_ARTICLES}_all_articles_with_qid_state.json"
)

# Phase 1b: Create all articles with QID sorted
ALL_ARTICLES_FILE_SORTED = (
    DATA_DIR / f"{ALL_ARTICLES}b_all_articles_with_qid_sorted"
    / f"{ALL_ARTICLES}b_all_articles_with_qid_sorted.jsonl"
)

# Phase 2: Get all humans with data
HUMAN_FILE_SORTED = (
    DATA_DIR / f"{PERSON_CANDIDATES}_person_candidates_sorted"
    / f"{PERSON_CANDIDATES}_person_candidates_sorted.jsonl"
)

P31_STATS_FILE_SORTED = (
    DATA_DIR / f"{PERSON_CANDIDATES}_person_candidates_sorted"
    / f"{PERSON_CANDIDATES}_p31_stats_sorted.json"
)

HUMAN_STATE_FILE_SORTED = (
    DATA_DIR / f"{PERSON_CANDIDATES}_person_candidates_sorted"
    / f"{PERSON_CANDIDATES}_person_candidates_sorted_state.json"
)

# Phase 4a: Linkscore
PERSONS_LINKSCORE_PASS1_FILE = (
    Path(__file__).parent
    / f"../data/{PERSON_WITH_LINKS}_linkscore/{PERSON_WITH_LINKS}a_persons_linkscore_pass1.jsonl"
)

PERSONS_LINKSCORE_PASS1_STATE_FILE = (
    Path(__file__).parent
    / f"../data/{PERSON_WITH_LINKS}_linkscore/{PERSON_WITH_LINKS}a_linkscore_pass1_state.json"
)

PERSONS_LINKSCORE_PASS2_FILE = (
    Path(__file__).parent
    / f"../data/{PERSON_WITH_LINKS}_linkscore/{PERSON_WITH_LINKS}b_persons_linkscore_pass2.jsonl"
)

PERSONS_LINKSCORE_PASS2_STATE_FILE = (
    Path(__file__).parent
    / f"../data/{PERSON_WITH_LINKS}_linkscore/{PERSON_WITH_LINKS}b_linkscore_pass2_state.json"
)

# Phase 5: Data enrichment
PERSONS_DATAENRICHMENT_CONTINENT_FILE = (
    Path(__file__).parent
    / f"../data/{PERSON_DATA_ENRICHMENT}_dataenrichment/{PERSON_DATA_ENRICHMENT}b_dataenrichment_cont.jsonl"
)

PERSONS_DATAENRICHMENT_CONTINENT_STATE_FILE = (
    Path(__file__).parent
    / f"../data/{PERSON_DATA_ENRICHMENT}_dataenrichment/{PERSON_DATA_ENRICHMENT}b_dataenrichment_cont_state.json"
)

CONTINENT_CACHE_FILE = (
    Path(__file__).parent
    / f"../data/{PERSON_DATA_ENRICHMENT}_dataenrichment/{PERSON_DATA_ENRICHMENT}b_continent_cache.json"
)

# Phase 6: Occupations
USED_OCCUPATIONS_FILE = (
    Path(__file__).parent
    / f"../data/{OCCUPATION}_occupation/{OCCUPATION}a_used-occupations.json"
)

OCCUPATION_GROUP_CACHE_FILE = (
    Path(__file__).parent
    / f"../data/{OCCUPATION}_occupation/{OCCUPATION}b_occupation-group-cache.json"
)

OCCUPATION_GROUP_STATE_FILE = (
    Path(__file__).parent
    / f"../data/{OCCUPATION}_occupation/{OCCUPATION}b_occupation-group-state.json"
)

OCCUPATION_GROUP_ERRORS_FILE = (
    Path(__file__).parent
    / f"../data/{OCCUPATION}_occupation/{OCCUPATION}b_occupation-group-errors.jsonl"
)

# Phase 7: Centuries
PERSON_CANDIDATES_WITH_CENTURIES_FILE = (
    Path(__file__).parent
    / f"../data/{PERSON_WITH_CENTURIES}_century/{PERSON_WITH_CENTURIES}_person_candidates_with_centuries.jsonl"
)

CENTURY_INDEX_FILE = (
    Path(__file__).parent
    / f"../data/{PERSON_WITH_CENTURIES}_century/{PERSON_WITH_CENTURIES}_century-index.json"
)