const fs = require("fs");

function loadJsonLines(
  file
) {

  return fs
    .readFileSync(
      file,
      "utf8"
    )
    .split("\n")
    .filter(Boolean)
    .map(
      line => JSON.parse(line)
    );
}

module.exports = {
  loadJsonLines
};