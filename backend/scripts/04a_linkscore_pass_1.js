const fs = require("fs");
const path = require("path");
const readline = require("readline");
const axios = require("axios");


const {
  HUMAN_OUTPUT_FILE_SORTED,
  PERSONS_LINKSCORE_PASS1_FILE,
  PERSONS_LINKSCORE_PASS1_STATE_FILE
} = require("../lib/config");



const INPUT_FILE = HUMAN_OUTPUT_FILE_SORTED;

const OUTPUT_FILE =PERSONS_LINKSCORE_PASS1_FILE;

const STATE_FILE =PERSONS_LINKSCORE_PASS1_STATE_FILE;


const BATCH_SIZE = 50;
const MAX_PERSONS = 5000000;

function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}

function loadState() {

  if (
    !fs.existsSync(
      STATE_FILE
    )
  ) {

    return {
      lineNumber: 0,
      processed: 0
    };
  }

  return JSON.parse(
    fs.readFileSync(
      STATE_FILE,
      "utf8"
    )
  );
}

function saveState(
  state
) {

  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(
      state,
      null,
      2
    )
  );
}

async function queryBatch(
  batch
) {

  while (true) {

    try {

      const titles =
        batch
          .map(
            p =>
              p.title
          )
          .join("|");

      const response =
        await axios.get(
          "https://de.wikipedia.org/w/api.php",
          {
            params: {

              action: "query",

              prop: "linkshere",

              titles,

              lhlimit: "max",

              lhnamespace: 0,

              lhshow:
                "!redirect",

              format: "json"
            },

            headers: {
              "User-Agent":
                "BestBuddiesBot/0.1"
            },

            timeout: 30000
          }
        );

      return response.data;

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

      throw err;
    }
  }
}

async function run() {

  const state =
    loadState();

  const startLine =
    state.lineNumber || 0;

  let processed =
    state.processed || 0;

  const output =
    fs.createWriteStream(
      OUTPUT_FILE,
      {
        flags:
          startLine > 0
            ? "a"
            : "w"
      }
    );

  console.log(
    `Fortsetzen bei Zeile ${startLine}`
  );

  const reader =
    readline.createInterface({
      input:
        fs.createReadStream(
          INPUT_FILE
        ),
      crlfDelay:
        Infinity
    });

  let lineNumber =
    0;

  let batch =
    [];

  for await (
    const line of reader
  ) {

    lineNumber++;

    if (
      lineNumber <=
      startLine
    )
    {
      continue;
    }

    const person =
      JSON.parse(
        line
      );

    batch.push(
      person
    );

    if (
      batch.length <
      BATCH_SIZE
    )
    {
      continue;
    }

    const data =
      await queryBatch(
        batch
      );

    const pages =
      data.query
        ?.pages || {};

    const hasMoreLinks =
      !!data.continue;

    for (
      const page
      of Object.values(
        pages
      )
    )
    {

      const person =
        batch.find(
          p =>
            p.title ===
            page.title
        );

      if (
        !person
      )
      {
        continue;
      }

      output.write(
        JSON.stringify({

          ...person,

          linkScore:
            (
              page.linkshere ||
              []
            ).length

         // hasMoreLinks,

          // lhcontinue:
          //   hasMoreLinks
          //     ? data.continue
          //         .lhcontinue
          //     : null

        }) + "\n"
      );

      processed++;
    }

    saveState({

      lineNumber,

      processed,

      lastTitle:
        batch[
          batch.length - 1
        ].title,

      lastQid:
        batch[
          batch.length - 1
        ].wikidataId,

      updatedAt:
        new Date()
          .toISOString()
    });

    console.log(
      `[${processed}]`
    );

    batch = [];

    if (
      processed >=
      MAX_PERSONS
    )
    {
      break;
    }

    await sleep(
      250
    );
  }

  output.end();

  console.log(
    "Pass 1 beendet."
  );
}

run().catch(
  console.error
);