const path = require("path");

const DATA_DIR =
  path.join(
    __dirname,
    "..",
    "data"
  );

module.exports = {

  DATA_DIR,

  OUTPUT_FILE:
    path.join(
      DATA_DIR,
      "all_articles_with_qid.jsonl"
    ),

  STATE_FILE:
    path.join(
      DATA_DIR,
      "all_articles_with_qid_state.json"
    ),

  REQUEST_DELAY_MS:
    3000
};