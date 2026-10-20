const fs = require("fs");
const readline = require("readline");
const path = require("path");




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
  PERSON_CANDIDATES_WITH_CENTURIES_FILE,
  OCCUPATION_GROUP_CACHE_FILE,
  OCCUPATION_GROUP_STATE_FILE,
  OCCUPATION_GROUP_ERRORS_FILE
} = require("../lib/config");

const INPUT_FILE = PERSON_CANDIDATES_WITH_CENTURIES_FILE

const CACHE_FILE = OCCUPATION_GROUP_CACHE_FILE;

const STATE_FILE = OCCUPATION_GROUP_STATE_FILE;

const ERROR_FILE = OCCUPATION_GROUP_ERRORS_FILE;

const TARGET_GROUPS = [
  "literatur",
   "autor",
  "schauspieler",
  "musiker",
  "maler",
  "komponist",
  "religion",
   "schriftsteller",
  "politik",
  "philosophie",
  "kunst",
  "militär",
  "wirtschaft",
  "sport",
  "medizin",
  "person",
   "diplomat",
    "künstler",
  "wissenschaft"
];

function normalize(text) {

  return (text || "")
    .toLowerCase()
    .trim();
}

async function loadEntityWithRetry(qid) {

  while (true) {

    try {

      const entities =
        await loadEntities([qid]);

      const entity =
        entities?.[qid];

      if (!entity) {

        throw new Error(
          `Entity fehlt: ${qid}`
        );
      }

      return entity;

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
          `429 bei ${qid}. Warte ${retryAfter}s`
        );

        await sleep(
          retryAfter * 1000
        );

        continue;
      }

      throw err;
    }
  }
}

async function resolveGroup(
  startQid,
  cache
) {

  if (
    cache[startQid]
  ) {

    return cache[
      startQid
    ].group;
  }

  const queue =
    [startQid];

  const visited =
    new Set();

  const pathHistory =
    [];

  let startLabel =
    null;

  while (
    queue.length > 0
  ) {

    const qid =
      queue.shift();

    if (
      visited.has(qid)
    ) {

      continue;
    }

    visited.add(qid);

    let entity;

    try {

      entity =
        await loadEntityWithRetry(
          qid
        );

    } catch (err) {

      fs.appendFileSync(
        ERROR_FILE,
        JSON.stringify({
          qid,
          error:
            err.message
        }) + "\n"
      );

      continue;
    }

    const label =
      normalize(
        entity.labels?.de
          ?.value ||
        entity.labels?.en
          ?.value ||
        ""
      );

    if (!startLabel) {

      startLabel =
        label;
    }

    pathHistory.push({
      qid,
      label
    });

    console.log(
      `Prüfe ${qid}: ${label}`
    );

    const match =
      TARGET_GROUPS.find(
        group =>
          label.includes(
            group
          )
      );

    if (
      match
    ) {

    for (
    const node
    of pathHistory
    )
    {
    cache[
        node.qid
    ] = {

        label:
        node.label,

        group:
        match,

        resolvedVia:
        label,

        resolvedViaQid:
        qid

        // path:
        // [...pathHistory]
    };
    }


      return match;
    }

    const parents =
      entity.claims
        ?.P279 || [];

      if (
      parents.length > 0
    )   {
      const parent=parents[0];
      const parentQid =
        parent.mainsnak
          ?.datavalue
          ?.value
          ?.id;

      if (
        parentQid
      ) {

        queue.push(
          parentQid
        );
      }
    }
  }

  cache[
    startQid
  ] = {

    label:
      startLabel,

    group:
      "nicht gefunden",

    resolvedVia:
      null,

    resolvedViaQid:
      null,

    path:
      [...pathHistory]
  };

  return "nicht gefunden";
}

async function run() {

  let cache = {};

  if (
    fs.existsSync(
      CACHE_FILE
    )
  ) {

    cache =
      JSON.parse(
        fs.readFileSync(
          CACHE_FILE,
          "utf8"
        )
      );
  }

  const state =
    loadState(
      STATE_FILE
    );

  const knownQids =
    new Set(
      Object.keys(
        cache
      )
    );

  const occupations =
    new Set();

  const rl =
    readline.createInterface({
      input:
        fs.createReadStream(
          INPUT_FILE
        ),
      crlfDelay:
        Infinity
    });

  let lineNumber = 0;

  for await (
    const line of rl
  ) {

    lineNumber++;

    if (
      lineNumber <
      (
        state.lineNumber ||
        0
      )
    ) {

      continue;
    }

    const person =
      JSON.parse(line);

    for (
      const occupationId
      of (
        person.occupationIds ||
        []
      )
    ) {

      if (
        !knownQids.has(
          occupationId
        )
      ) {

        occupations.add(
          occupationId
        );
      }
    }
  }
  const occupationsToProcess =
    [...occupations]
      .sort();

  console.log(
    `${occupationsToProcess.length.toLocaleString("de-DE")} neue Berufe`
  );

  let processed =
    state.processed || 0;

for (
  let i = processed;
  i < occupationsToProcess.length;
  i++
)
  
  {

      const occupationId =
    occupationsToProcess[i];
    const group =
      await resolveGroup(
        occupationId,
        cache
      );

    processed =
    i + 1;

    cache[
      occupationId
    ].lastProcessed =
      new Date()
        .toISOString();

    if (
      processed % 10 === 0
    ) {

      fs.writeFileSync(
        CACHE_FILE,
        JSON.stringify(
          cache,
          null,
          2
        )
      );

      saveState(
        STATE_FILE,
        {
          lineNumber,
          processed,
          updatedAt:
            new Date()
              .toISOString()
        }
      );

      console.log(
        `${processed}/${occupations.size}`
      );
    }

    console.log(
      occupationId,
      "→",
      group,
      "-------------------------------------"
    );
  }

  fs.writeFileSync(
    CACHE_FILE,
    JSON.stringify(
      cache,
      null,
      2
    )
  );

  saveState(
    STATE_FILE,
    {
      lineNumber,
      processed,
      updatedAt:
        new Date()
          .toISOString()
    }
  );

  console.log(
    "Fertig."
  );
}

run().catch(
  console.error
);