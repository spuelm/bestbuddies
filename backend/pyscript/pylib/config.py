from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / "data_p"
DATA_DIR = Path(
    "C:/Users/steph/OneDrive/Projekte/Bestbuddies/git/bestbuddies/backend/data_p"
)
ALL_ARTICLES = "01"
PERSON_CANDIDATES = "02"
PERSON_WITH_LINKS = "03"
CONTINENTS = "04"
OCCUPATION = "05"
PERSON_WITH_CENTURIES = "06"
REQUEST_DELAY_S = 3
# Phase 1: Get all articles with QID
ALL_ARTICLES_INFIX = "_all_articles"
ALL_ARTICLES_FILE = (
    DATA_DIR
    / f"{ALL_ARTICLES}{ALL_ARTICLES_INFIX}"
    / f"{ALL_ARTICLES}_all_articles_with_qid.jsonl"
)
ALL_ARTICLES_STATE_FILE = (
    DATA_DIR
    / f"{ALL_ARTICLES}{ALL_ARTICLES_INFIX}"
    / f"{ALL_ARTICLES}_all_articles_with_qid_state.json"
)
# Phase 2: Get all humans with data
PERSON_FILE_INFIX = "_person_candidates"
PERSON_FILE = (
    DATA_DIR
    / f"{PERSON_CANDIDATES}{PERSON_FILE_INFIX}"
    / f"{PERSON_CANDIDATES}_person_candidates.jsonl"
)
P31_STATS_FILE = (
    DATA_DIR
    / f"{PERSON_CANDIDATES}{PERSON_FILE_INFIX}"
    / f"{PERSON_CANDIDATES}_p31_stats.json"
)
PERSON_STATE_FILE = (
    DATA_DIR
    / f"{PERSON_CANDIDATES}{PERSON_FILE_INFIX}"
    / f"{PERSON_CANDIDATES}_person_candidates_state.json"
)
# Phase 3: Linkscore --------------------------------------------------------------------------------------
PERSONS_LINKSCORE_INFIX = "_persons_linkscore"
PERSONS_LINKSCORE_PASS1_FILE = (
    DATA_DIR
    / f"{PERSON_WITH_LINKS}{PERSONS_LINKSCORE_INFIX}"
    / f"{PERSON_WITH_LINKS}a{PERSONS_LINKSCORE_INFIX}_pass1.jsonl"
)
PERSONS_LINKSCORE_PASS1_STATE_FILE = (
    DATA_DIR
    / f"{PERSON_WITH_LINKS}{PERSONS_LINKSCORE_INFIX}"
    / f"{PERSON_WITH_LINKS}a_{PERSONS_LINKSCORE_INFIX}_pass1_state.json"
)


PERSONS_LINKSCORE_PASS2_FILE = (
    DATA_DIR
    / f"{PERSON_WITH_LINKS}{PERSONS_LINKSCORE_INFIX}"
    / f"{PERSON_WITH_LINKS}b_{PERSONS_LINKSCORE_INFIX}_pass2.jsonl"
)
PERSONS_LINKSCORE_PASS2_STATE_FILE = (
    DATA_DIR
    / f"{PERSON_WITH_LINKS}{PERSONS_LINKSCORE_INFIX}"
    / f"{PERSON_WITH_LINKS}b_{PERSONS_LINKSCORE_INFIX}_pass2_state.json"
)
# Phase 4: continents  ---------------------------------------------------------
CONTINENT_INFIX = "_continents"
COUNTRY_INFIX = "country"
COUNTRY_CACHE_FILE = (
    DATA_DIR
    / f"{CONTINENTS}{CONTINENT_INFIX}"
    / f"{CONTINENTS}a_{COUNTRY_INFIX}_cache.jsonl"
)

COUNTRY_STATE_FILE = (
    DATA_DIR
    / f"{CONTINENTS}{CONTINENT_INFIX}"
    / f"{CONTINENTS}a_{COUNTRY_INFIX}_state.json"
)
CONTINENT_CACHE_FILE = (
    DATA_DIR
    / f"{CONTINENTS}{CONTINENT_INFIX}"
    / f"{CONTINENTS}b{CONTINENT_INFIX}_cache.jsonl"
)

CONTINENT_FILE = (
    DATA_DIR
    / f"{CONTINENTS}{CONTINENT_INFIX}"
    / f"{CONTINENTS}c{CONTINENT_INFIX}.jsonl"
)
CONTINENT_STATE_FILE = (
    DATA_DIR
    / f"{CONTINENTS}{CONTINENT_INFIX}"
    / f"{CONTINENTS}c{CONTINENT_INFIX}_state.json"
)


PERSONS_WITH_LOCATION_FILE = (
    DATA_DIR / f"{CONTINENTS}{CONTINENT_INFIX}" / f"persons_with_location.jsonl"
)

# Phase 6: Occupations
USED_OCCUPATIONS_FILE = (
    DATA_DIR / f"{OCCUPATION}_occupation/{OCCUPATION}a_used-occupations.json"
)
OCCUPATION_GROUP_CACHE_FILE = (
    DATA_DIR / f"{OCCUPATION}_occupation/{OCCUPATION}b_occupation-group-cache.json"
)
OCCUPATION_GROUP_STATE_FILE = (
    DATA_DIR / f"{OCCUPATION}_occupation/{OCCUPATION}b_occupation-group-state.json"
)
OCCUPATION_GROUP_ERRORS_FILE = (
    DATA_DIR / f"{OCCUPATION}_occupation/{OCCUPATION}b_occupation-group-errors.jsonl"
)
# Phase 7: Centuries
PERSON_CANDIDATES_WITH_CENTURIES_FILE = (
    DATA_DIR
    / f"{PERSON_WITH_CENTURIES}_century/{PERSON_WITH_CENTURIES}_person_candidates_with_centuries.jsonl"
)
CENTURY_INDEX_FILE = (
    DATA_DIR
    / f"{PERSON_WITH_CENTURIES}_century/{PERSON_WITH_CENTURIES}_century-index.json"
)
