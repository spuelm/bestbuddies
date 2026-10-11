const axios =
  require("axios");

async function fetchBatch(
  gapcontinue
) {

  const params = {
    action: "query",
    generator: "allpages",
    gaplimit: 500,
    prop: "pageprops",
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
            "BestBuddiesBot/0.1"
        },
        timeout: 30000
      }
    );

  return response.data;
}

module.exports = {
  fetchBatch
};