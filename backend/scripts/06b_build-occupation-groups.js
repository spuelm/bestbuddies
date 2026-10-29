const fs = require("fs");
const path = require("path");

const {
  OCCUPATION_GROUP_CACHE_FILE,
  OCCUPATION_GROUP_STATE_FILE,
  OCCUPATION_GROUP_ERRORS_FILE,
  USED_OCCUPATIONS_FILE
} = require("../lib/config");

const INPUT_FILE = USED_OCCUPATIONS_FILE;

const CACHE_FILE = OCCUPATION_GROUP_CACHE_FILE;

const STATE_FILE = OCCUPATION_GROUP_STATE_FILE;

const ERROR_FILE = OCCUPATION_GROUP_ERRORS_FILE;

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
  { name: "literat", group: "literatur" },
  { name: "writer", group: "literatur" },
  { name: "autor", group: "literatur" },
  // Musik --------------------------------
  { name: "musik", group: "musik" },
  { name: "music", group: "musik" },
  { name: "singer", group: "musik" },
  { name: "composer", group: "musik" },
  // Politik ---------------------------------
  { name: "politik", group: "politik" },
  { name: "politic", group: "politik" },
  { name: "radikaler", group: "politik" },
  { name: "bürgerrechtler", group: "politik" },
  { name: "anführer", group: "politik" },
  { name: "aktivist", group: "politik" },
  { name: "herrschaft", group: "politik" },
  { name: "regierung", group: "politik" },
  { name: "beamter", group: "politik" },
  { name: "bürgermeister", group: "politik" },
  { name: "proprietor", group: "politik" },
  { name: "gauleitung", group: "politik" },
  { name: "bürgermeister", group: "politik" },
  { name: "bürgermeister", group: "politik" },
  { name: "bürgermeister", group: "politik" },
  { name: "bürgermeister", group: "politik" },
  { name: "herrscher", group: "politik" },
  { name: "aristokrat", group: "politik" },
  { name: "häuptling", group: "politik" },
  { name: "samurai", group: "politik" },
  { name: "regierend", group: "politik" },
  { name: "adelstitel", group: "politik" },
  { name: "prinzgemahl", group: "politik" },
  { name: "landeshauptmann", group: "politik" },


  // Philosophie ---------------------------------
  { name: "philosoph", group: "philosophie" },
  // Technik ------------------------------------------
  { name: "techni", group: "technik" },
  { name: "informatiker", group: "technik" },
  { name: "baumeister", group: "technik" },
  { name: "orgelbauer", group: "technik" },
  // Kunst ---------------------------------------
  { name: "kunst", group: "künstler" },
  { name: "künstler", group: "künstler" },
  { name: "theater", group: "künstler" },
  { name: "tanz", group: "künstler" },
  { name: "fotograf", group: "künstler" },
  { name: "photogra", group: "künstler" },
  { name: "architekt", group: "künstler" },
  { name: "interpret", group: "künstler" },
  { name: "holzschnitzer", group: "künstler" },
  { name: "töpfer", group: "künstler" },
  { name: "kupferstecher", group: "künstler" },


  // Religion -------------------------------------
  { name: "religi", group: "religion" },
  { name: "rabbi", group: "religion" },
  { name: "bishop", group: "religion" },
  { name: "islamic", group: "religion" },
  { name: "mitropolit", group: "religion" },
  { name: "theolog", group: "religion" },
  // Militär ------------------------------------------
  { name: "milit", group: "militär" },
  { name: "soldat", group: "militär" },
  { name: "marschall", group: "militär" },
  { name: "offizier", group: "militär" },
  { name: "crusader", group: "militär" },
  { name: "ritter", group: "militär" },
  { name: "söldner", group: "militär" },
  // Sport -------------------------------------
  { name: "sport", group: "sport" },
  { name: "snooker", group: "sport" },
  { name: "fußball", group: "sport" },
  { name: "karambolage", group: "sport" },
  { name: "billard", group: "sport" },
  { name: "dart", group: "sport" },
  { name: "pokerspieler", group: "sport" },
  // Medizin -------------------------------------
  { name: "medizin", group: "medizin" },
  { name: "medic", group: "medizin" },
  { name: "arzt", group: "medizin" },
  { name: "physicist", group: "medizin" },
  // Wiurtschaft -----------------------------------
  { name: "wirtschaft", group: "wirtschaft" },
  { name: "management", group: "wirtschaft" },
  { name: "economy", group: "wirtschaft" },
  { name: "unternehmer", group: "wirtschaft" },

  { name: "bankier", group: "wirtschaft" },
  { name: "banker", group: "wirtschaft" },
  { name: "kaufmann", group: "wirtschaft" },
  { name: "geschäftsmann", group: "wirtschaft" },
  { name: "landwirt", group: "wirtschaft" },

  // Wissenschaft ------------------------------------
  { name: "wissenschaft", group: "wissenschaft" },
  { name: "ingenieur", group: "wissenschaft" },
  { name: "museum", group: "wissenschaft" },
  { name: "profess", group: "wissenschaft" },
  { name: "forsch", group: "wissenschaft" },
  { name: "academi", group: "wissenschaft" },
  { name: "physics", group: "wissenschaft" },
  { name: "research", group: "wissenschaft" },
  { name: "scienti", group: "wissenschaft" },
  { name: "science", group: "wissenschaft" },
  { name: "hochschullehrer", group: "wissenschaft" },
  { name: "gelehrter", group: "wissenschaft" },



  { name: "person", group: "person" },
  { name: "fahrzeugführer", group: "person" },

  { name: "art", group: "kunst" }


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
        const [index, node]
        of pathHistory.entries()
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
          index: index,
          resolvedViaQid:
            cache[qid]
              .resolvedViaQid,

          ...(index === 0 && pathHistory.length > 1
            ? { path: [...pathHistory] }
            : {/*do nothing*/ })
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
            group.name
          )
      );

    if (
      match
    ) {

      for (
        const [index, node]
        of pathHistory.entries()
      ) {

        cache[
          node.qid
        ] = {

          label:
            node.label,

          group:
            match.group,

          index: index,
          resolvedVia:
            label,

          resolvedViaQid:
            qid,
          ...(index === 0 && pathHistory.length > 1
            ? { path: [...pathHistory] }
            : {/*do nothing*/ })
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
    const [index, node]
    of pathHistory.entries()
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
      ...(index === 0 && pathHistory.length > 1
        ? { path: [...pathHistory] }
        : {/*do nothing*/ })

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