const axios =
  require("axios");

async function fetchBatch(
  gapcontinue
) {

  const params = {
    action: "query",
    generator: "allpages",
    gaplimit: 500,
    // prop: "pageprops",
    prop: "pageprops|info",
    format: "json"
  };

  if (
    gapcontinue
  ) {

    params.gapcontinue =
      gapcontinue;
  }

  const response =
    await axios.get(
      "https://de.wikipedia.org/w/api.php",
      {
        params,
        headers: {
          "User-Agent":
            "BestBuddiesBotWiki/0.1"
        },
        timeout: 30000
      }
    );

  return response.data;
}

module.exports = {
  fetchBatch
};