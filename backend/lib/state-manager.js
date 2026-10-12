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


function saveState2(
  stateFile,
  gapcontinue,
  articleCount,
  qidCount
) {

  fs.writeFileSync(
    stateFile,
    JSON.stringify(
      {
        gapcontinue,
        articleCount,
        qidCount,
        updatedAt:
          new Date()
            .toISOString()
      },
      null,
      2
    )
  );
}


function loadState2(file) {

  if (
    !fs.existsSync(
      file
    )
  ) {

    return {
      gapcontinue: null,
      articleCount: 0,
      qidCount: 0
    };
  }

  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8"
    )
  );
}

module.exports = {
  loadState,
  saveState,
  loadState2,
  saveState2
};