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

  ALL_ARTICLES_FILE:
    path.join(
      DATA_DIR,
      "all_articles_with_qid.jsonl"
    ),

  ALL_ARTICLES_STATE_FILE:
    path.join(
      DATA_DIR,
      "all_articles_with_qid_state.json"
    ),

  HUMAN_OUTPUT_FILE:
    path.join(
      DATA_DIR,
      "person_candidates.jsonl"
    ),

  HUMAN_STATE_FILE:
    path.join(
      DATA_DIR,
      "human_filter_state.json"
    ),

  P31_STATS_FILE:
    path.join(
      DATA_DIR,
      "p31_stats.json"
    )
};