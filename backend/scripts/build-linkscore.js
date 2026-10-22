const fs = require("fs");
const readline = require("readline");
const path = require("path");
const axios = require("axios");

const {
  HUMAN_OUTPUT_FILE_SORTED,
  PERSONS_WITH_LINKS_FILE,
  PERSONS_WITH_LINKS_STATE_FILE

} = require("../lib/config");
const INPUT_FILE =HUMAN_OUTPUT_FILE_SORTED;

const OUTPUT_FILE =PERSONS_WITH_LINKS_FILE;

const STATE_FILE =PERSONS_WITH_LINKS_STATE_FILE;

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

async function getLinkScore(title) {

  let totalLinks = 0;

  let lhcontinue = null;

  while (true) {

    try {

      const params = {
        action: "query",
        prop: "linkshere",

        titles: title,

        lhlimit: "max",

        lhshow: "!redirect",

        lhnamespace: 0,

        format: "json"
      };

      if (lhcontinue) {

        params.lhcontinue =
          lhcontinue;
      }

      const response =
        await axios.get(
          "https://de.wikipedia.org/w/api.php",
          {
            params,
            headers: {
              "User-Agent":
                "BestBuddiesBot/0.1"
            },
            timeout: 30000
          }
        );

      const pages =
        response?.data
          ?.query
          ?.pages || {};

      const page =
        Object.values(
          pages
        )[0];

      if (!page) {

        return totalLinks;
      }

      const links =
        page.linkshere || [];

      const validLinks =
        links.filter(
          link =>
            !link.redirect
        );

      totalLinks +=
        validLinks.length;

      if (
        !response.data.continue
      ) {

        return totalLinks;
      }

      lhcontinue =
        response.data.continue
          .lhcontinue;

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
          `        429 bei ${title}. Warte ${retryAfter}s`
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

async function run() {

  const state =
    loadState();

  const startLine =
    state.lineNumber || 0;

  let processed =
    state.processed || 0;

  console.log(
    `Fortsetzen bei Zeile ${startLine.toLocaleString("de-DE")}`
  );

  const rl =
    readline.createInterface({
      input:
        fs.createReadStream(
          INPUT_FILE
        ),
      crlfDelay:
        Infinity
    });

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

  let lineNumber =
    0;

  for await (
    const line of rl
  ) {

    lineNumber++;

    if (
      lineNumber <=
      startLine
    ) {

      continue;
    }

    if (
      processed >=
      MAX_PERSONS
    ) {

      console.log(
        `Limit ${MAX_PERSONS.toLocaleString("de-DE")} erreicht`
      );

      break;
    }

    const person =
      JSON.parse(
        line
      );

    try {

      const linkScore =
        await getLinkScore(
          person.title
        );

      const enriched =
        {
          ...person,
          linkScore
        };

      output.write(
        JSON.stringify(
          enriched
        ) + "\n"
      );

      processed++;

      if (
        processed % 1 ===
        0
      ) {

        saveState({
          lineNumber,
          processed,

          lastQid:
            person.wikidataId,

          lastTitle:
            person.title,

          updatedAt:
            new Date()
              .toISOString()
        });

        console.log(
          `[${processed.toLocaleString("de-DE")}] ` +
          `${person.title} ` +
          `articlen: ${person.articleLength} ` +
          `→ Linkscore=${linkScore}`
        );
      }

      await sleep(
        500
      );

    } catch (err) {

      console.error(
        `Fehler bei ${person.title}:`,
        err.message
      );

      saveState({
        lineNumber:
          lineNumber - 1,

        processed,

        lastQid:
          person.wikidataId,

        lastTitle:
          person.title,

        updatedAt:
          new Date()
            .toISOString()
      });
    
    }
  }

  output.end();

  saveState({
    lineNumber,
    processed,
    updatedAt:
      new Date()
        .toISOString()
  });

  console.log(
    "Linkscore-Ermittlung beendet."
  );
}

run().catch(
  console.error
);