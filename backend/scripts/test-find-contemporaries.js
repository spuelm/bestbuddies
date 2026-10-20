const {
  findContemporaries
} =
require(
  "../lib/find-contemporaries"
);
const {
  PERSON_CANDIDATES_WITH_CENTURIES_FILE,
  CENTURY_INDEX_FILE
} = require("../lib/config");

const fs =
  require("fs");
const readline =
  require("readline");
const path =
  require("path");

const PEOPLE_FILE =PERSON_CANDIDATES_WITH_CENTURIES_FILE;



//const rootPersonQid = "Q5879"; // Goethe
const rootPersonQid = "Q37030"; // Thomas mann

    
async function loadPeople() {

  const peopleByQid =
    {};

  const rl =
    readline.createInterface({
      input:
        fs.createReadStream(
          PEOPLE_FILE
        ),
      crlfDelay:
        Infinity
    });

  for await (
    const line of rl
  ) {

    if (
      !line.trim()
    ) {
      continue;
    }

    const person =
      JSON.parse(line);

    peopleByQid[
      person.wikidataId
    ] = person;
  }

  return peopleByQid;
}

async function run() {

  const peopleByQid =
    await loadPeople();

  const centuryIndex =
    JSON.parse(
      fs.readFileSync(
        CENTURY_INDEX_FILE,
        "utf8"
      )
    );
  const targetPerson =
    peopleByQid[
      rootPersonQid
    ];
    

    
  const result =
    findContemporaries(
      targetPerson.wikidataId,
      peopleByQid,
      centuryIndex
    );




  console.log(
    JSON.stringify(
      result.slice(
        0,
        50
      ),
      null,
      2
    )
  );
console.log(
  `Gefundene Zeitgenossen: ${result.length.toLocaleString("de-DE")}`
);

console.log(
  `Angezeigt werden die ersten ${Math.min(100, result.length)} Treffer`
);
}

run().catch(
  console.error
);
