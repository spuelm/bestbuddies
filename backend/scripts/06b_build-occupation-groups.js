const fs = require("fs");
const path = require("path");

const {
  OCCUPATION_GROUP_CACHE_FILE,
  OCCUPATION_GROUP_STATE_FILE,
  OCCUPATION_GROUP_ERRORS_FILE,
  USED_OCCUPATIONS_FILE
} = require("../lib/config");

const INPUT_FILE =USED_OCCUPATIONS_FILE;

const CACHE_FILE =OCCUPATION_GROUP_CACHE_FILE;

const STATE_FILE =OCCUPATION_GROUP_STATE_FILE;

const ERROR_FILE =OCCUPATION_GROUP_ERRORS_FILE;

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

const TARGET_GROUPS = [
  "literatur",
  "musik",
  "wissenschaft",
  "wissenschaftler",
  "politik",
  "philosophie",
  "kunst",
  "religion",
  "militär",
  "wirtschaft",
  "sport",
  "medizin",
  "person"
];

function normalize(text) {

  return (text || "")
    .toLowerCase()
    .trim();
}

async function loadEntityWithRetry(
  qid
) {

  while (true) {

    try {

      const entities =
        await loadEntities(
          [qid]
        );

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

    if (
      cache[qid]
    ) {

      const cachedGroup =
        cache[qid].group;

      for (
        const node
        of pathHistory
      ) {

        cache[
          node.qid
        ] = {

          label:
            node.label,

          group:
            cachedGroup,

          resolvedVia:
            cache[qid]
              .resolvedVia,

          resolvedViaQid:
            cache[qid]
              .resolvedViaQid,

          path:
            [...pathHistory]
        };
      }

      return cachedGroup;
    }

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
        entity.labels?.de?.value ||
        entity.labels?.en?.value ||
        ""
      );

    if (
      !startLabel
    ) {

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
      ) {

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
            qid,

          path:
            [...pathHistory]
        };
      }

      return match;
    }

    const parents =
      entity.claims
        ?.P279 || [];

    const firstParent =
      parents?.[0];

    if (
      !firstParent
    ) {

      break;
    }

    const parentQid =
      firstParent
        ?.mainsnak
        ?.datavalue
        ?.value
        ?.id;

    if (
      !parentQid
    ) {

      break;
    }

    queue.push(
      parentQid
    );
  }

  for (
    const node
    of pathHistory
  ) {

    cache[
      node.qid
    ] = {

      label:
        node.label,

      group:
        "nicht gefunden",

      resolvedVia:
        null,

      resolvedViaQid:
        null,

      path:
        [...pathHistory]
    };
  }

  return "nicht gefunden";
}

async function run() {

  let cache =
    {};

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

  const occupations =
    JSON.parse(
      fs.readFileSync(
        INPUT_FILE,
        "utf8"
      )
    );

  const occupationIds =
    occupations
      .map(
        item =>
          item.occupationId
      );

  const occupationsToProcess =
    occupationIds
      .filter(
        qid =>
          !cache[qid]
      )
      .sort();

  let startIndex = 0;

  if (
    state.lastOccupationId
  ) {

    const idx =
      occupationsToProcess
        .indexOf(
          state.lastOccupationId
        );

    if (idx >= 0) {

      startIndex =
        idx + 1;
      }
  }    

  let processed =
    state.processed || 0;

  console.log(
    `${occupationsToProcess.length.toLocaleString("de-DE")} neue Berufe`
  );
  for (
    let i = startIndex;
    i <
      occupationsToProcess.length;
    i++
  ) {

    const occupationId =
      occupationsToProcess[
        i
      ];

    try {

      const group =
        await resolveGroup(
          occupationId,
          cache
        );

    const current =
      i + 1;

      console.log('current=', current, 'processed=', processed, 'occupationId=', occupationId, 'group=', group);

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
            processed,

            lastOccupationId:
              occupationId,

            updatedAt:
              new Date()
                .toISOString()
          }
        );

        console.log(
          `${processed}/${occupationsToProcess.length}`
        );
      

      console.log(
        occupationId,
        "→",
        group
      );

    } catch (err) {

      fs.appendFileSync(
        ERROR_FILE,
        JSON.stringify({
          qid:
            occupationId,

          error:
            err.message,

          updatedAt:
            new Date()
              .toISOString()
        }) + "\n"
      );

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
          processed,

          lastOccupationId:
            occupationId,

          updatedAt:
            new Date()
              .toISOString()
        }
      );

      console.error(
        occupationId,
        err.message
      );
    }
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
      processed,

      lastOccupationId:
        occupationsToProcess[
          occupationsToProcess.length - 1
        ],

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