const path = require("path");

const DATA_DIR =
  path.join(
    __dirname,
    "..",
    "data"
  );
const ALL_ARTICLES = "01";
const PERSON_CANDIDATES = "02";
// 03 fehlt
const PERSON_WITH_LINKS = "04";
const PERSON_WITH_CENTURIES = "05";
const OCCUPATION = "06";

module.exports = {

  DATA_DIR,

  REQUEST_DELAY_MS: 3000,
//- Phase 1: Get all articles with QID
  ALL_ARTICLES_FILE:  
    path.join(
      DATA_DIR,
      "../data/"+ALL_ARTICLES+"_all_articles_with_qid//"+ALL_ARTICLES+"_all_articles_with_qid.jsonl"
    ),
  ALL_ARTICLES_STATE_FILE:
    path.join(
      DATA_DIR,
      "../data//"+ALL_ARTICLES+"_all-articles-with-quid//"+ALL_ARTICLES+"_all_articles_with_qid_state.json"
    ),
//phase 1b: Create all articles with QID sorted
   ALL_ARTICLES_FILE_SORTED:
    path.join(
      DATA_DIR,
      "../data//"+ALL_ARTICLES+"b_all_articles_with_quid_sorted//"+ALL_ARTICLES+"b_all_articles_with_qid_sorted.jsonl"
    ),

// Phase 2: Get all humans with data
    HUMAN_OUTPUT_FILE_SORTED:
    path.join(
      DATA_DIR,
      "../data/"+PERSON_CANDIDATES+"_person_candidates_sorted/"+PERSON_CANDIDATES+"_person_candidates_sorted.jsonl"
    ),
    P31_STATS_FILE_SORTED:
    path.join(
      DATA_DIR,
      "../data/"+PERSON_CANDIDATES+"_person_candidates_sorted/"+PERSON_CANDIDATES+"_p31_stats_sorted.json"
    ),

  HUMAN_STATE_FILE_SORTED:
    path.join(
      DATA_DIR,
      "../data/"+PERSON_CANDIDATES+"_person_candidates_sorted/"+PERSON_CANDIDATES+"_person_candidates_sorted_state.json"
    ),
  //   //phase 3: Get all humans with links
  //  PERSONS_WITH_LINKS_FILE: 
  // path.join(
  //   __dirname,
  //   "../data/with_links/persons_with_linkscore.jsonl"
  // ),
  //  PERSONS_WITH_LINKS_STATE_FILE:
  //   path.join(
  //     __dirname,
  //     "../data/with_links/linkscore_state.json"
  //   ),

// pahse 4a linkscore pass 1
  PERSONS_LINKSCORE_PASS1_FILE:
    path.join(
      __dirname,
      "../data//"+PERSON_WITH_LINKS+"_linkscore/"+PERSON_WITH_LINKS+"a_persons_linkscore_pass1.jsonl"
    ),

  PERSONS_LINKSCORE_PASS1_STATE_FILE:
    path.join(
      __dirname,
      "../data//"+PERSON_WITH_LINKS+"_linkscore//"+PERSON_WITH_LINKS+"a_linkscore_pass1_state.json"
    ),



  PERSONS_LINKSCORE_PASS1_FILE_SORTED:
    path.join(
      __dirname,
      "../data//"+PERSON_WITH_LINKS+"_linkscore/"+PERSON_WITH_LINKS+"b_persons_linkscore_pass1_sorted.jsonl"
    ),














  // Phase 5: Get all humans with centuries and century index  
  PERSON_CANDIDATES_WITH_CENTURIES_FILE:
      path.join(
        __dirname,
        "../data/"+PERSON_WITH_CENTURIES+"_century/"+PERSON_WITH_CENTURIES+"_person_candidates_with_centuries.jsonl"
      ),
 
  CENTURY_INDEX_FILE:
    path.join(
      __dirname,
      "../data/"+PERSON_WITH_CENTURIES+"_century/"+PERSON_WITH_CENTURIES+"_century-index.json"
    ),


// Pahse 6: Get all used occupations
 USED_OCCUPATIONS_FILE:
  path.join(
    __dirname,
    "../data/"+OCCUPATION+"_occupation//"+OCCUPATION+"a_used-occupations.json"
  ),


  OCCUPATION_GROUP_CACHE_FILE:
  path.join(
    __dirname,
    "../data//"+OCCUPATION+"_occupation//"+OCCUPATION+"b_occupation-group-cache.json"
  ),
OCCUPATION_GROUP_STATE_FILE:
  path.join(
    __dirname,
    "../data//"+OCCUPATION+"_occupation//"+OCCUPATION+"b_occupation-group-state.json"
  ),

 OCCUPATION_GROUP_ERRORS_FILE:
  path.join(
    __dirname,
    "../data//"+OCCUPATION+"_occupation//"+OCCUPATION+"b_occupation-group-errors.jsonl"
  )

};