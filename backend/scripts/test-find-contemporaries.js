const {
  findContemporaries
} =
require(
  "../lib/find-contemporaries"
);

const fs =
  require("fs");
const readline =
  require("readline");
const path =
  require("path");

const PEOPLE_FILE =
  path.join(
    __dirname,
    "../data/person_candidates_with_centuries.jsonl"
  );

const CENTURY_INDEX_FILE =
  path.join(
    __dirname,
    "../data/century-index.json"
  );

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

  const result =
    findContemporaries(
      "Q5879", // Goethe
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
}

run().catch(
  console.error
);
