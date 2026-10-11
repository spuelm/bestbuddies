const fs = require("fs");

function loadState(file) {

  if (!fs.existsSync(file)) {

    return {
      lineNumber: 0,
      processed: 0,
      humans: 0,
      updatedAt: null
    };
  }

  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8"
    )
  );
}

function saveState(
  file,
  state
) {

  fs.writeFileSync(
    file,
    JSON.stringify(
      state,
      null,
      2
    )
  );
}

module.exports = {
  loadState,
  saveState
};