


BOT_HEADER = "ZeitzeugenBot/1.0 (https://de.wikipedia.org/wiki/Benutzer:ZeitzeugenBot; s.puelm@gmx.de)"

const axios =
  require("axios");



const {
  getClient,
} = require(
  "./mediawiki-client"
);

async function wdataLoadEntities(qids) {




  const client =
    await getClient();



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
          "Api-User-Agent": BOT_HEADER
        }
      }
    );



  return (
    response?.data?.entities ||
    {}
  );



}





async function wpediaFetchBatch(
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
          "User-Agent": BOT_HEADER
        },
        timeout: 30000
      }
    );

  return response.data;
}








module.exports = {
  wdataLoadEntities,
  wpediaFetchBatch,
  BOT_HEADER,
  P_POSITION_HELT: "P39",
  P_BITRH_YEAR: "P569",
  P_DEATH_YEAR: "P570",
  P_NATIONALITIES: "P27",
  P_OCCUPATIONS: "P106",
  P_GIVEN_NAMES: "P735",
  P_FANILY_NAMES: "P734",
  P_BIRTH_PLACE: "P19",
  P_CONTINENTS: "P30",
  BOT_HEADER

};