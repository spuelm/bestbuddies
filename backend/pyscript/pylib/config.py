from importlib.resources import files
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
ALL_FILES = []
# Phase 1: Get all articles with QID
ARTICLES_INFIX = "all_articles"
ARTICLES_DIR = DATA_DIR / f"{ALL_ARTICLES}_{ARTICLES_INFIX}"
ALL_ARTICLES_FILE = ARTICLES_DIR / f"{ALL_ARTICLES}_{ARTICLES_INFIX}_with_qid.jsonl"
ALL_ARTICLES_STATE_FILE = (
    ARTICLES_DIR / f"{ALL_ARTICLES}_{ARTICLES_INFIX}_with_qid_state.json"
)
RESULT_PHASE_1_FILE = ALL_ARTICLES_FILE
ALL_FILES.append(ALL_ARTICLES_FILE)
ALL_FILES.append(ALL_ARTICLES_STATE_FILE)
# Phase 2: Get all humans with data ----------------------------------------------------------------------------
PERSON_CANDIDATES_INFIX = "person_candidates"
PERSON_DATA_DIR = DATA_DIR / f"{PERSON_CANDIDATES}_{PERSON_CANDIDATES_INFIX}"
PERSON_FILE = PERSON_DATA_DIR / f"{PERSON_CANDIDATES}_{PERSON_CANDIDATES_INFIX}.jsonl"
P31_STATS_FILE = (
    PERSON_DATA_DIR / f"{PERSON_CANDIDATES}_{PERSON_CANDIDATES_INFIX}_p31_stats.json"
)
PERSON_STATE_FILE = (
    PERSON_DATA_DIR / f"{PERSON_CANDIDATES}_{PERSON_CANDIDATES_INFIX}_state.json"
)
RESULT_PHASE_2_FILE = PERSON_FILE
ALL_FILES.append(PERSON_FILE)
ALL_FILES.append(P31_STATS_FILE)
ALL_FILES.append(PERSON_STATE_FILE)
# Phase 3: Linkscore --------------------------------------------------------------------------------------------
PERSONS_LINKSCORE_INFIX = "linkscore"
PERSONS_LINKSCORE_DIR = DATA_DIR / f"{PERSON_WITH_LINKS}_{PERSONS_LINKSCORE_INFIX}"
PERSONS_LINKSCORE_PASS1_FILE = (
    PERSONS_LINKSCORE_DIR
    / f"{PERSON_WITH_LINKS}a_{PERSONS_LINKSCORE_INFIX}_pass1.jsonl"
)
PERSONS_LINKSCORE_PASS1_STATE_FILE = (
    PERSONS_LINKSCORE_DIR
    / f"{PERSON_WITH_LINKS}a_{PERSONS_LINKSCORE_INFIX}_pass1_state.json"
)
PERSONS_LINKSCORE_PASS2_FILE = (
    PERSONS_LINKSCORE_DIR
    / f"{PERSON_WITH_LINKS}b_{PERSONS_LINKSCORE_INFIX}_pass2.jsonl"
)
PERSONS_LINKSCORE_PASS2_STATE_FILE = (
    PERSONS_LINKSCORE_DIR
    / f"{PERSON_WITH_LINKS}b_{PERSONS_LINKSCORE_INFIX}_pass2_state.json"
)
RESULT_PHASE_3_FILE = PERSONS_LINKSCORE_PASS2_FILE
ALL_FILES.append(PERSONS_LINKSCORE_PASS1_FILE)
ALL_FILES.append(PERSONS_LINKSCORE_PASS1_STATE_FILE)
ALL_FILES.append(PERSONS_LINKSCORE_PASS2_FILE)
ALL_FILES.append(PERSONS_LINKSCORE_PASS2_STATE_FILE)
# Phase 4: continents  ---------------------------------------------------------
CONTINENT_INFIX = "_continents"
CONTINENT_DIR = DATA_DIR / f"{CONTINENTS}{CONTINENT_INFIX}"
COUNTRY_INFIX = "country"
COUNTRY_CACHE_FILE = CONTINENT_DIR / f"{CONTINENTS}a_{COUNTRY_INFIX}_cache.jsonl"
COUNTRY_STATE_FILE = CONTINENT_DIR / f"{CONTINENTS}a_{COUNTRY_INFIX}_state.json"
CONTINENT_CACHE_FILE = CONTINENT_DIR / f"{CONTINENTS}b{CONTINENT_INFIX}_cache.jsonl"
PERSONS_WITH_LOCATION_FILE = (
    CONTINENT_DIR / f"{CONTINENTS}c_persons_with_location.jsonl"
)
RESULT_PHASE_4_FILE = PERSONS_WITH_LOCATION_FILE
ALL_FILES.append(COUNTRY_CACHE_FILE)
ALL_FILES.append(COUNTRY_STATE_FILE)
ALL_FILES.append(CONTINENT_CACHE_FILE)
ALL_FILES.append(PERSONS_WITH_LOCATION_FILE)
# Phase 5: Occupations ---------------------------------------------------------
OCCUPATION_DIR = DATA_DIR / f"{OCCUPATION}_occupation"
USED_OCCUPATIONS_FILE = OCCUPATION_DIR / f"{OCCUPATION}a_used-occupations.json"
OCCUPATION_GROUP_CACHE_FILE = (
    OCCUPATION_DIR / f"{OCCUPATION}b_occupation-group-cache.json"
)
OCCUPATION_GROUP_STATE_FILE = (
    OCCUPATION_DIR / f"{OCCUPATION}b_occupation-group-state.json"
)
OCCUPATION_GROUP_ERRORS_FILE = (
    OCCUPATION_DIR / f"{OCCUPATION}b_occupation-group-errors.jsonl"
)
ALL_FILES.append(USED_OCCUPATIONS_FILE)
ALL_FILES.append(OCCUPATION_GROUP_CACHE_FILE)
ALL_FILES.append(OCCUPATION_GROUP_STATE_FILE)
ALL_FILES.append(OCCUPATION_GROUP_ERRORS_FILE)
# Phase 7: Centuries ---------------------------------------------------------
PERSON_CANDIDATES_WITH_CENTURIES_FILE = (
    DATA_DIR
    / f"{PERSON_WITH_CENTURIES}_century/{PERSON_WITH_CENTURIES}_person_candidates_with_centuries.jsonl"
)
CENTURY_INDEX_FILE = (
    DATA_DIR
    / f"{PERSON_WITH_CENTURIES}_century/{PERSON_WITH_CENTURIES}_century-index.json"
)


# ----------------------------------------------------------------

if __name__ == "__main__":
    print("Files:")
    for file in ALL_FILES:
        print(f"  {file}")
