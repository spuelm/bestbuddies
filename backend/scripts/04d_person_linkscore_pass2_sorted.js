const fs = require("fs");
const readline = require("readline");
const path = require("path");

const {
  
  PERSONS_LINKSCORE_PASS2_FILE,
  PERSONS_LINKSCORE_PASS2_FILE_SORTED
} = require("../lib/config");


const INPUT_FILE =PERSONS_LINKSCORE_PASS2_FILE;

const OUTPUT_FILE = PERSONS_LINKSCORE_PASS2_FILE_SORTED;

async function run() {

  const people = [];

  const reader =
    readline.createInterface({
      input:
        fs.createReadStream(
          INPUT_FILE
        ),
      crlfDelay:
        Infinity
    });

  let loaded = 0;

  for await (
    const line of reader
  ) {

    if (
      !line.trim()
    ) {

      continue;
    }

    const person =
      JSON.parse(line);

    const linkScore =
      (
        person.linkScore ||
        0
      ) === 0
        ? 501
        : person.linkScore;

    people.push({

      ...person,

      linkScore
    });

    loaded++;

    if (
      loaded % 100000 === 0
    ) {

      console.log(
        `${loaded.toLocaleString("de-DE")} Datensätze geladen`
      );
    }
  }

  console.log(
    `Sortiere ${people.length.toLocaleString("de-DE")} Datensätze`
  );

  people.sort(
    (a, b) =>
      a.linkScore -
      b.linkScore
  );

  const output =
    fs.createWriteStream(
      OUTPUT_FILE
    );

  let written = 0;

  for (
    const person
    of people
  ) {

    output.write(
      JSON.stringify(
        person
      ) + "\n"
    );

    written++;

    if (
      written % 100000 === 0
    ) {

      console.log(
        `${written.toLocaleString("de-DE")} geschrieben`
      );
    }
  }

  output.end();

  console.log(
    "Fertig."
  );
}

run().catch(
  console.error
);