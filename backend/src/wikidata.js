const axios = require("axios");

async function findPerson(searchText) {
  const response = await axios.get(
    "https://www.wikidata.org/w/api.php",
    {
      params: {
        action: "wbsearchentities",
        search: searchText,
        language: "de",
        uselang: "de",
        format: "json",
        limit: 1
      },
      headers: {
        "User-Agent": "BestBuddies/0.1"
      }
    }
  );

  if (!response.data.search.length) {
    return null;
  }

  const person = response.data.search[0];

  return {
    name: person.label,
    wikidataId: person.id,
    beschreibung: person.description
  };
}
function getYear(wikidataDate) {
  if (!wikidataDate) {
    return null;
  }

  return parseInt(
    wikidataDate.substring(1, 5)
  );
}

async function getPersonDetails(qid) {
  const response = await axios.get(
    `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
    {
      headers: {
        "User-Agent": "BestBuddies/0.1"
      }
    }
  );

  const entity = response.data.entities[qid];
  const claims = entity.claims;

  const birth =
    claims.P569?.[0]?.mainsnak?.datavalue?.value?.time || null;

  const death =
    claims.P570?.[0]?.mainsnak?.datavalue?.value?.time || null;

    return {
        geboren: getYear(birth),
        gestorben: getYear(death)
    };
}

module.exports = {
  findPerson,
  getPersonDetails
};