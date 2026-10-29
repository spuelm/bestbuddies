
const MAX_HUMANS = 5000000;
const fs = require("fs");
const readline = require("readline");
let lastTitle = "";
let lastArticleLength = 0;

const {
  wdataLoadEntities,
  P_POSITION_HELT,
  P_BITRH_YEAR,
  P_DEATH_YEAR,
  P_NATIONALITIES,
  P_OCCUPATIONS,
  P_GIVEN_NAMES,
  P_FANILY_NAMES,
  P_BIRTH_PLACE,
  P_CONTINENTS
} = require("../lib/wiki-api");


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
  HUMAN_FILE_SORTED,
  HUMAN_STATE_FILE_SORTED,
  P31_STATS_FILE_SORTED
} = require("../lib/config");

const INPUT_FILE = ALL_ARTICLES_FILE_SORTED;
const OUTPUT_FILE = HUMAN_FILE_SORTED;
const STATE_FILE = HUMAN_STATE_FILE_SORTED;
const STATISTICS_FILE = P31_STATS_FILE_SORTED;

const BATCH_SIZE = 50;


function getSingleEntityId(
  claims,
  property
) {

  return claims?.[property]?.[0]
    ?.mainsnak
    ?.datavalue
    ?.value
    ?.id || null;
}



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
        await wdataLoadEntities(
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


    const claims =
      entity.claims || {};

    const birthYear =
      getYear(
        claims,
        P_BITRH_YEAR
      );

    const deathYear =
      getYear(
        claims,
        P_DEATH_YEAR
      );

    const nationalityIds =
      getEntityIds(
        claims,
        P_NATIONALITIES
      );

    const occupationIds =
      getEntityIds(
        claims,
        P_OCCUPATIONS
      );

    const positionsHeld =
      getEntityIds(
        claims,
        P_POSITION_HELT
      );

    const givenNameIds =
      getEntityIds(
        claims,
        P_GIVEN_NAMES
      );

    const familyNameIds =
      getEntityIds(
        claims,
        P_FANILY_NAMES
      );

    const birthPlaceId =
      getSingleEntityId(
        claims,
        P_BIRTH_PLACE
      );

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

    lastArticleLength = item.articleLength;
    if (isHuman) {
      lastTitle = item.title;

      humans.push({

        pageid:
          item.pageid,

        ns:
          item.ns,

        title:
          item.title,

        wikidataId:
          item.wikidataId,

        articleLength:
          item.articleLength,

        birthYear,

        deathYear,

        nationalityIds,

        occupationIds,
        positionsHeld,

        givenNameIds,

        familyNameIds,

        birthPlaceId


      });
    }
  }

  return humans;
}
function getYear(
  claims,
  property
) {
  const time =
    claims?.[property]?.[0]
      ?.mainsnak
      ?.datavalue
      ?.value
      ?.time;

  if (!time) {
    return null;
  }

  const match =
    time.match(
      /^([+-]\d+)/
    );

  if (!match) {
    return null;
  }

  return parseInt(
    match[1],
    10
  );
}

function getEntityIds(
  claims,
  property
) {

  const values =
    claims?.[property] || [];

  return values
    .map(
      item =>
        item.mainsnak
          ?.datavalue
          ?.value
          ?.id
    )
    .filter(Boolean);
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
      INPUT_FILE
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
          OUTPUT_FILE,
          results
        );
      }

      fs.writeFileSync(
        STATISTICS_FILE,
        JSON.stringify(
          stats,
          null,
          2
        )
      );

      saveState(
        STATE_FILE,
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
        `ln=[${currentLine.toLocaleString("de-DE")}] `
        + `p=[${processed.toLocaleString("de-DE")}] `
        + `Menschen=${humans.toLocaleString("de-DE")} `
        + `(${rate}%)`
        + ` AL=${lastArticleLength} `
        + ` ${lastTitle}`
      );

      batch = [];

      //  await sleep(
      //     1000
      //   );

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
