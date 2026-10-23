const axios =
  require("axios");


const {
  login
} = require(
  "../lib/mediawiki-client"
);

async function loadEntities(qids) {

const client =
  await login();

  console.log(client);

  const response =
    await client.get(
      "https://www.wikidata.org/w/api.php",
      {
        params: {
          action: "wbgetentities",
          ids: qids.join("|"),
          format: "json"
        },
        headers: {
             "Api-User-Agent": "ZeitzeugenBot/1.0 (https://de.wikipedia.org/wiki/Benutzer:ZeitzeugenBot; s.puelm@gmx.de)"
        }
      }
    );

  return (
    response?.data?.entities ||
    {}
  );
}

module.exports = {
  loadEntities
};