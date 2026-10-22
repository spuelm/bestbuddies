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
      "../data/01_all_articles_with_qid/01_all_articles_with_qid.jsonl"
    ),
  ALL_ARTICLES_STATE_FILE:
    path.join(
      DATA_DIR,
      "../data/01_all-articles-with-quid/01_all_articles_with_qid_state.json"
    ),
//phase 1b: Create all articles with QID sorted
   ALL_ARTICLES_FILE_SORTED:
    path.join(
      DATA_DIR,
      "../data/01b_all_articles_with_quid_sorted/01b_all_articles_with_qid_sorted.jsonl"
    ),


// Phase 2: Get all humans with data
    HUMAN_OUTPUT_FILE_SORTED:
    path.join(
      DATA_DIR,
      "../data/02_person_candidates_sorted/02_person_candidates_sorted.jsonl"
    ),
    P31_STATS_FILE_SORTED:
    path.join(
      DATA_DIR,
      "../data/02_person_candidates_sorted/02_p31_stats_sorted.json"
    ),

  HUMAN_STATE_FILE_SORTED:
    path.join(
      DATA_DIR,
      "../data/02_person_candidates_sorted/02_person_candidates_sorted_state.json"
    ),
//phase 3: Get all humans with links
   PERSONS_WITH_LINKS_FILE: 
  path.join(
    __dirname,
    "../data/with_links/persons_with_linkscore.jsonl"
  ),
   PERSONS_WITH_LINKS_STATE_FILE:
    path.join(
      __dirname,
      "../data/with_links/linkscore_state.json"
    ),

// pahse4a linkscore pass 1
  PERSONS_LINKSCORE_PASS1_FILE:
    path.join(
      __dirname,
      "../data/04_linkscore/04a_persons_linkscore_pass1.jsonl"
    ),

  PERSONS_LINKSCORE_PASS1_STATE_FILE:
    path.join(
      __dirname,
      "../data/04_linkscore/04a_linkscore_pass1_state.json"
    ),








  // Phase 4: Get all humans with centuries and century index  
  PERSON_CANDIDATES_WITH_CENTURIES_FILE:
      path.join(
        __dirname,
        "../data/04_century/04_person_candidates_with_centuries.jsonl"
      ),
 
  CENTURY_INDEX_FILE:
    path.join(
      __dirname,
      "../data/04_century/04_century-index.json"
    ),



 USED_OCCUPATIONS_FILE:
  path.join(
    __dirname,
    "../data/05_occupation/05a_used-occupations.json"
  ),


  OCCUPATION_GROUP_CACHE_FILE:
  path.join(
    __dirname,
    "../data/05_occupation/05b_occupation-group-cache.json"
  ),
OCCUPATION_GROUP_STATE_FILE:
  path.join(
    __dirname,
    "../data/05_occupation/05c_occupation-group-state.json"
  ),

 OCCUPATION_GROUP_ERRORS_FILE:
  path.join(
    __dirname,
    "../data/05_occupation/05d_occupation-group-errors.jsonl"
  )

};