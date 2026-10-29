const axios = require("axios");
const BOT_HEADER = require("../lib/wiki-api");

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
        "User-Agent": BOT_HEADER
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

async function getEntityLabel(qid) {
  const response = await axios.get(
    `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
    {
      headers: {
        "User-Agent": BOT_HEADER
      }
    }
  );

  const entity = response.data.entities[qid];

  return (
    entity.labels?.de?.value ||
    entity.labels?.en?.value ||
    qid
  );
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
        "User-Agent": BOT_HEADER
      }
    }
  );

  const entity = response.data.entities[qid];
  const claims = entity.claims;

  const birth =
    claims.P569?.[0]?.mainsnak?.datavalue?.value?.time || null;

  const death =
    claims.P570?.[0]?.mainsnak?.datavalue?.value?.time || null;
  const occupations =
    claims.P106?.map(
      item => item.mainsnak.datavalue.value.id
    ) || [];

  return {
    geboren: getYear(birth),
    gestorben: getYear(death),
    berufe: occupations
  };
}

module.exports = {

  BOT_HEADER: "ZeitzeugenBot/1.0 (https://de.wikipedia.org/wiki/Benutzer:ZeitzeugenBot; s.puelm@gmx.de)",
  findPerson,
  getPersonDetails,
  getEntityLabel
};