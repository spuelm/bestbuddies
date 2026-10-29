
const {
  BOT_HEADER
} = require("../lib/config");


const axios =
  require("axios");



const {
  getClient
} = require(
  "../lib/mediawiki-client"
);

async function loadEntities(qids) {




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

module.exports = {
  loadEntities,
  P_POSITION_HELT: "P39",
  P_BITRH_YEAR: "P569",
  P_DEATH_YEAR: "P570",
  P_NATIONALITIES: "P27",
  P_OCCUPATIONS: "P106",
  P_GIVEN_NAMES: "P735",
  P_FANILY_NAMES: "P734",
  P_BIRTH_PLACE: "P19",
  P_CONTINENTS: "P30"

};