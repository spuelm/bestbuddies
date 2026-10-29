// @TODO linkshere pass1 mit auslesen

const fs =
  require("fs");

const {
  DATA_DIR,
  ALL_ARTICLES_FILE,
  ALL_ARTICLES_STATE_FILE,
  REQUEST_DELAY_MS
} =
  require("../lib/config");

const {
  sleep
} =
  require("../lib/sleep");

const {
  wpediaFetchBatch
} =
  require("../lib/wiki-api");

const {
  appendRecords
} =
  require("../lib/jsonl-writer");

const {
  loadState2,
  saveState2
} =
  require("../lib/state-manager");

const {
  logProgress
} =
  require("../lib/progress");

async function run() {

  if (
    !fs.existsSync(
      DATA_DIR
    )
  ) {

    fs.mkdirSync(
      DATA_DIR,
      {
        recursive: true
      }
    );
  }

  const state =
    loadState2(
      ALL_ARTICLES_STATE_FILE
    );

  let gapcontinue =
    state.gapcontinue;

  let articleCount =
    state.articleCount;

  let qidCount =
    state.qidCount;

  console.log(
    `Fortsetzen bei ${articleCount.toLocaleString("de-DE")} Artikeln`
  );

  while (true) {

    try {

      const data =
        await wpediaFetchBatch(
          gapcontinue
        );

      const pages =
        Object.values(
          data.query.pages
        );

      const records =
        [];

      for (
        const page of pages
      ) {

        const wikidataId =
          page.pageprops
            ?.wikibase_item
          || null;

        if (
          wikidataId
        ) {

          qidCount++;
        }

        records.push({
          pageid: page.pageid,

          ns: page.ns,

          title: page.title,

          wikidataId,

          hasQid:
            wikidataId !== null,

          articleLength:
            page.length || 0
        });

        articleCount++;
      }

      appendRecords(
        ALL_ARTICLES_FILE,
        records
      );

      gapcontinue =
        data.continue
          ?.gapcontinue ||
        null;

      saveState2(
        ALL_ARTICLES_STATE_FILE,
        gapcontinue,
        articleCount,
        qidCount
      );

      logProgress(
        articleCount,
        qidCount
      );

      if (
        !gapcontinue
      ) {

        console.log(
          "Wikipedia vollständig verarbeitet."
        );

        break;
      }

      await sleep(
        REQUEST_DELAY_MS
      );

    } catch (err) {

      if (
        err.response?.status === 429
      ) {

        const retryAfter =
          parseInt(
            err.response.headers[
            "retry-after"
            ]
          ) || 60;

        console.log(
          `429 erhalten. Warte ${retryAfter}s`
        );

        await sleep(
          retryAfter * 1000
        );

        continue;
      }

      console.error(
        err.message
      );

      saveState2(
        ALL_ARTICLES_STATE_FILE,
        gapcontinue,
        articleCount,
        qidCount
      );

      break;
    }
  }
}

run()
  .then(() => {

    console.log(
      "Crawler beendet."
    );

  })
  .catch(err => {

    console.error(
      "Fataler Fehler:"
    );

    console.error(err);
  });