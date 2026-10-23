const axios =
  require("axios");

async function loadEntities(qids) {

  const response =
    await axios.get(
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