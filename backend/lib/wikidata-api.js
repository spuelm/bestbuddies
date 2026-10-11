const axios =
  require("axios");

async function loadEntities(
  qids
) {

  const response =
    await axios.get(
      "https://www.wikidata.org/w/api.php",
      {
        params: {
          action:
            "wbgetentities",
          ids:
            qids.join("|"),
          format: "json"
        },
        headers: {
          "User-Agent":
            "BestBuddiesBot/0.1"
        }
      }
    );

  return response.data.entities;
}

module.exports = {
  loadEntities
};