const fs =
  require("fs");

function appendRecords(
  outputFile,
  records
) {

  let buffer = "";

  for (
    const record of records
  ) {

    buffer +=
      JSON.stringify(
        record
      ) + "\n";
  }

  fs.appendFileSync(
    outputFile,
    buffer,
    "utf8"
  );
}

module.exports = {
  appendRecords
};