const path = require("path");

const DATA_DIR =
  path.join(
    __dirname,
    "..",
    "data"
  );

module.exports = {

  DATA_DIR,

  REQUEST_DELAY_MS: 3000,
//- Phase 1: Get all articles with QID
  ALL_ARTICLES_FILE:
    path.join(
      DATA_DIR,
      "all_articles_with_qid.jsonl"
    ),
   ALL_ARTICLES_FILE_SORTED:
    path.join(
      DATA_DIR,
      "all_articles_with_qid_sorted.jsonl"
    ),

  ALL_ARTICLES_STATE_FILE:
    path.join(
      DATA_DIR,
      "all_articles_with_qid_state.json"
    ),

// Phase 2: Get all humans with data
    HUMAN_OUTPUT_FILE_SORTED:
    path.join(
      DATA_DIR,
      "person_candidates_sorted.jsonl"
    ),
    P31_STATS_FILE_SORTED:
    path.join(
      DATA_DIR,
      "p31_stats_sorted.json"
    ),

  HUMAN_STATE_FILE_SORTED:
    path.join(
      DATA_DIR,
      "person_candidates_sorted_state.json"
    ),

  // Phase 3: Get all humans with centuries and century index  
  PERSON_CANDIDATES_WITH_CENTURIES_FILE:
      path.join(
        __dirname,
        "../data/person_candidates_with_centuries.jsonl"
      ),
 
  CENTURY_INDEX_FILE:
    path.join(
      __dirname,
      "../data/century-index.json"
    )



};