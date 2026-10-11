const fs =
  require("fs");

function loadState(
  stateFile
) {

  if (
    !fs.existsSync(
      stateFile
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
      stateFile,
      "utf8"
    )
  );
}

function saveState(
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

module.exports = {
  loadState,
  saveState
};
