
const MAX_HUMANS = 5000000;
const fs = require("fs");
const readline = require("readline");

const {
  loadEntities
} = require("../lib/wikidata-api");

const {
  sleep
} = require("../lib/sleep");

const {
  loadState,
  saveState
} = require("../lib/state-manager");

const {
  appendRecords
} = require("../lib/jsonl-writer");

const {
  ALL_ARTICLES_FILE_SORTED,
  HUMAN_OUTPUT_FILE_SORTED,
  HUMAN_STATE_FILE_SORTED,
  P31_STATS_FILE_SORTED 
} = require("../lib/config");

const BATCH_SIZE = 50;

async function processBatch(
  batch,
  stats
) {

  const qids =
    batch.map(
      item =>
        item.wikidataId
    );

  let entities;

  while (true) {

    try {

      entities =
        await loadEntities(
          qids
        );

      if (
        !entities ||
        typeof entities !== "object"
      ) {

        throw new Error(
          "Keine gültigen Entities erhalten"
        );
      }

      break;

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

      throw err;
    }
  }

  const humans = [];

  for (const item of batch) {

    const entity =
      entities?.[
        item.wikidataId
      ];

    if (!entity) {

      console.log(
        `Entity fehlt: ${item.wikidataId}`
      );

      continue;
    }

    const p31 =
      entity.claims
        ?.P31 || [];

    let isHuman =
      false;

    for (
      const claim of p31
    ) {

      const typeId =
        claim.mainsnak
          ?.datavalue
          ?.value
          ?.id;

      if (!typeId) {
        continue;
      }

      stats[typeId] =
        (
          stats[typeId] || 0
        ) + 1;

      if (
        typeId === "Q5"
      ) {

        isHuman = true;
      }
    }

    if (isHuman) {

      humans.push({
        ...item,
        isHuman: true
      });
    }
  }

  return humans;
}

async function run() {

  const state =
    loadState(
      HUMAN_STATE_FILE_SORTED
    );

  let stats =
    {};

  if (
    fs.existsSync(
      P31_STATS_FILE_SORTED
    )
  ) {

    stats =
      JSON.parse(
        fs.readFileSync(
          P31_STATS_FILE_SORTED,
          "utf8"
        )
      );
  }

  let processed =
    state.processed || 0;

  let humans =
    state.humans || 0;

  let currentLine =
    0;

  const startLine =
    state.lineNumber || 0;

  console.log(
    `Fortsetzen bei Zeile ${startLine.toLocaleString("de-DE")}`
  );

  const stream =
    fs.createReadStream(
      ALL_ARTICLES_FILE_SORTED
    );

  const rl =
    readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

  let batch = [];

  for await (
    const line of rl
  ) {

    currentLine++;

    if (
      currentLine <
      startLine
    ) {

      continue;
    }

    const item =
      JSON.parse(line);

    if (
      !item.hasQid
    ) {

      continue;
    }

    batch.push(item);

    if (
      batch.length <
      BATCH_SIZE
    ) {

      continue;
    }

    try {

      const results =
        await processBatch(
          batch,
          stats
        );

      humans +=
        results.length;

      if (humans >= MAX_HUMANS) {

        console.log(
          `Ziel erreicht: ${MAX_HUMANS.toLocaleString("de-DE")} Personen`
        );

        saveState(
          HUMAN_STATE_FILE_SORTED,
          {
            lineNumber: currentLine,
            processed,
            humans,
            updatedAt:
              new Date().toISOString()
          }
        );

        process.exit(0);
      }
      processed +=
        batch.length;

      if (
        results.length > 0
      ) {

        appendRecords(
          HUMAN_OUTPUT_FILE_SORTED,
          results
        );
      }

      fs.writeFileSync(
        P31_STATS_FILE_SORTED,
        JSON.stringify(
          stats,
          null,
          2
        )
      );

      saveState(
        HUMAN_STATE_FILE_SORTED,
        {
          lineNumber:
            currentLine,
          processed,
          humans,
          updatedAt:
            new Date()
              .toISOString()
        }
      );

      const rate =
        (
          humans /
          Math.max(
            processed,
            1
          ) * 100
        ).toFixed(2);

      console.log(
        `[${processed.toLocaleString("de-DE")}] `
        + `Menschen=${humans.toLocaleString("de-DE")} `
        + `(${rate}%)`
      );

      batch = [];

      await sleep(
        1000
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

      saveState(
        HUMAN_STATE_FILE_SORTED,
        {
          lineNumber:
            currentLine,
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
