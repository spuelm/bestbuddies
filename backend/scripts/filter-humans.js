const fs = require("fs");

const {
  loadJsonLines
} =
require("../lib/jsonl-reader");

const {
  loadEntities
} =
require("../lib/wikidata-api");

const {
  sleep
} =
require("../lib/sleep");

const {
  loadState,
  saveState
} =
require("../lib/state-manager");

const {
  appendRecords
} =
require("../lib/jsonl-writer");


const readline =
  require("readline");

const stream =
  fs.createReadStream(
    ALL_ARTICLES_FILE
  );

const rl =
  readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });

  

const {
  ALL_ARTICLES_FILE,
  HUMAN_OUTPUT_FILE,
  HUMAN_STATE_FILE,
  P31_STATS_FILE
} =
require("../lib/config");

const BATCH_SIZE = 50;

async function run() {

  const state =
    loadState(
      HUMAN_STATE_FILE
    );

  const allItems =
    loadJsonLines(
      ALL_ARTICLES_FILE
    );

  let lineNumber =
    state.lineNumber || 0;

  let processed =
    state.processed || 0;

  let humans =
    state.humans || 0;

  let p31Stats =
    {};

  if (
    fs.existsSync(
      P31_STATS_FILE
    )
  ) {

    p31Stats =
      JSON.parse(
        fs.readFileSync(
          P31_STATS_FILE,
          "utf8"
        )
      );
  }

  console.log(
    `Fortsetzen bei Zeile ${lineNumber.toLocaleString("de-DE")}`
  );

  while (
    lineNumber <
    allItems.length
  ) {

    const batch = [];

    while (
      batch.length <
        BATCH_SIZE &&
      lineNumber <
        allItems.length
    ) {

      const item =
        allItems[
          lineNumber
        ];

      lineNumber++;

      if (     !item.hasQid
      ) {

        continue;
      }

      batch.push(
        item
      );
    }

    if (
      batch.length === 0
    ) {

      break;
    }

    try {

      const entities =
        await loadEntities(
          batch.map(
            item =>
              item.wikidataId
          )
        );

      const results =
        [];

      for (
        const item
        of batch
      ) {

        const entity =
          entities[
            item.wikidataId
          ];

        if (
          !entity
        ) {

          continue;
        }

        const p31 =
          entity.claims
            ?.P31 || [];

        let isHuman =
          false;

        for (
          const claim
          of p31
        ) {

          const typeId =
            claim.mainsnak
              ?.datavalue
              ?.value
              ?.id;

          if (
            !typeId
          ) {

            continue;
          }

          p31Stats[
            typeId
          ] =
            (
              p31Stats[
                typeId
              ] || 0
            ) + 1;

          if (
            typeId ===
            "Q5"
          ) {

            isHuman =
              true;
          }
        }

        if (
          isHuman
        ) {

          humans++;

          results.push({
            ...item,
            isHuman:
              true
          });
        }

        processed++;
      }

      if (
        results.length > 0
      ) {

        appendRecords(
          HUMAN_OUTPUT_FILE,
          results
        );
      }

      fs.writeFileSync(
        P31_STATS_FILE,
        JSON.stringify(
          p31Stats,
          null,
          2
        )
      );

      saveState(
        HUMAN_STATE_FILE,
        {
          lineNumber,
          processed,
          humans,
          updatedAt:
            new Date().toISOString()
        }
      );

      const humanRate =
        (
          humans /
          Math.max(
            processed,
            1
          ) *
          100
        ).toFixed(2);

      console.log(
        `[${processed.toLocaleString("de-DE")}] `
        + `Menschen= ${humans.toLocaleString("de-DE")} `
        + `(${humanRate}%)`
      );

      await sleep(
        1000
      );

    } catch (err) {

      if (
        err.response?.status ===
        429
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
          retryAfter *
          1000
        );

        continue;
      }

      console.error(
        err.message
      );

      saveState(
        HUMAN_STATE_FILE,
        {
          lineNumber,
          processed,
          humans,
          updatedAt:
            new Date()
              .toISOString()
        }
      );

      break;
    }
  }

  console.log(
    "Human-Filter beendet."
  );
}

run().catch(
  console.error
);