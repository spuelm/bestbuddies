const fs = require("fs");
const readline = require("readline");
const path = require("path");

const INPUT_FILE =
  path.join(
    __dirname,
    "../data/all_articles_with_qid.jsonl"
  );

const OUTPUT_FILE =
  path.join(
    __dirname,
    "../data/all_articles_with_qid_sorted.jsonl"
  );

async function run() {

  const people = [];

  const rl =
    readline.createInterface({
      input:
        fs.createReadStream(
          INPUT_FILE
        ),
      crlfDelay:
        Infinity
    });

  let count = 0;

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

    people.push(
      person
    );

    count++;

    if (
      count % 100000 === 0
    ) {

      console.log(
        `${count.toLocaleString("de-DE")} Datensätze geladen`
      );
    }
  }

  console.log(
    `Sortiere ${people.length.toLocaleString("de-DE")} Personen...`
  );

  people.sort(
    (a, b) =>
      (b.articleLength || 0) -
      (a.articleLength || 0)
  );

  console.log(
    "Schreibe Ergebnisdatei..."
  );

  const stream =
    fs.createWriteStream(
      OUTPUT_FILE
    );

  for (
    const person
    of people
  ) {

    stream.write(
      JSON.stringify(person) + "\n"
    );
  }

  stream.end();

  console.log(
    "Fertig."
  );
}

run().catch(
  console.error
);
