const fs = require("fs");
const readline = require("readline");
const path = require("path");
const {

  HUMAN_OUTPUT_FILE_SORTED,
  USED_OCCUPATIONS_FILE
} = require("../lib/config");

const INPUT_FILE =HUMAN_OUTPUT_FILE_SORTED;

const OUTPUT_FILE = USED_OCCUPATIONS_FILE;

async function run() {

  const occupations =
    new Map();

  const reader =
    readline.createInterface({
      input:
        fs.createReadStream(
          INPUT_FILE
        ),
      crlfDelay:
        Infinity
    });

  let processed = 0;

  for await (const line of reader) {

    if (!line.trim()) {
      continue;
    }

    const person =
      JSON.parse(line);

    const occupationIds =
      person.occupationIds || [];

    for (
      const occupationId
      of occupationIds
    ) {

      occupations.set(
        occupationId,
        (
          occupations.get(
            occupationId
          ) || 0
        ) + 1
      );
    }

    processed++;

    if (
      processed % 100000 === 0
    ) {

      console.log(
        `${processed.toLocaleString("de-DE")} Personen geprüft`
      );
    }
  }

  const result =
    [...occupations.entries()]
      .map(
        ([qid, count]) => ({

          occupationId:
            qid,

          count
        })
      )
      .sort(
        (a, b) =>
          b.count -
          a.count
      );

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(
      result,
      null,
      2
    )
  );

  console.log(
    `${result.length.toLocaleString("de-DE")} unterschiedliche Berufe exportiert`
  );
}

run().catch(
  console.error
);