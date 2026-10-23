const fs = require("fs");
const readline = require("readline");
const path = require("path");



const {
  PERSONS_WITH_LINKS_FILE,
  PERSON_CANDIDATES_WITH_CENTURIES_FILE,
  CENTURY_INDEX_FILE
} = require("../lib/config");


const INPUT_FILE =  PERSONS_WITH_LINKS_FILE;

const OUTPUT_FILE = PERSON_CANDIDATES_WITH_CENTURIES_FILE;

const INDEX_FILE = CENTURY_INDEX_FILE;

function getCentury(
  year
) {

  if (
    year === null ||
    year === undefined
  ) {

    return null;
  }

  if (
    year > 0
  ) {

    return (
      Math.floor(
        (year - 1) / 100
      ) + 1
    );
  }

  return -(
    Math.floor(
      (
        Math.abs(year) - 1
      ) / 100
    ) + 1
  );
}

function getCenturies(
  birthYear,
  deathYear
) {

  if (!birthYear) {
    return [];
  }

  const endYear =
    deathYear ||
    new Date()
      .getFullYear();

  const startCentury =
    getCentury(
      birthYear
    );

  const endCentury =
    getCentury(
      endYear
    );

  const result =
    [];

  if (
    startCentury < 0 &&
    endCentury > 0
  ) {

    for (
      let c =
        startCentury;
      c <= -1;
      c++
    ) {

      result.push(c);
    }

    for (
      let c = 1;
      c <= endCentury;
      c++
    ) {

      result.push(c);
    }

    return result;
  }

  if (
    startCentury <=
    endCentury
  ) {

    for (
      let c =
        startCentury;
      c <=
        endCentury;
      c++
    ) {

      result.push(c);
    }

  } else {

    for (
      let c =
        startCentury;
      c >=
        endCentury;
      c--
    ) {

      result.push(c);
    }
  }

  return result;
}

async function run() {

  const centuryIndex =
    {};

  const reader =
    readline.createInterface({
      input:
        fs.createReadStream(
          INPUT_FILE
        ),
      crlfDelay:
        Infinity
    });

  const writer =
    fs.createWriteStream(
      OUTPUT_FILE
    );

  let processed = 0;

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

    const centuries =
      getCenturies(
        person.birthYear,
        person.deathYear
      );

    const enriched =
      {
        ...person,
        centuries
      };

    writer.write(
      JSON.stringify(
        enriched
      ) + "\n"
    );

    for (
      const century
      of centuries
    ) {

      if (
        !centuryIndex[
          century
        ]
      ) {

        centuryIndex[
          century
        ] = [];
      }

      centuryIndex[
        century
      ].push(
        person.wikidataId
      );
    }

    processed++;

    if (
      processed % 10000 === 0
    ) {

      console.log(
        `${processed.toLocaleString("de-DE")} verarbeitet`
      );
    }
  }

  writer.end();

  fs.writeFileSync(
    INDEX_FILE,
    JSON.stringify(
      centuryIndex,
      null,
      2
    )
  );

  console.log(
    "Century-Index fertig."
  );
}

run().catch(
  console.error
);