const axios =
  require("axios");

const {
  wrapper
} =
require(
  "axios-cookiejar-support"
);

const {
  CookieJar
} =
require(
  "tough-cookie"
);

const WIKI_API =
  "https://de.wikipedia.org/w/api.php";

let client =
  null;

async function createClient() {

  const jar =
    new CookieJar();

  client =
    wrapper(
      axios.create({
        jar,
        withCredentials:
          true
      })
    );

  const tokenResponse =
    await client.get(
      WIKI_API,
      {
        params: {
          action: "query",
          meta: "tokens",
          type: "login",
          format: "json"
        }
      }
    );

  const loginToken =
    tokenResponse.data
      .query
      .tokens
      .logintoken;

  await client.post(
    WIKI_API,
    new URLSearchParams({

      action: "login",

      lgname:
        process.env
          .WIKI_BOT_USER,

      lgpassword:
        process.env
          .WIKI_BOT_PASSWORD,

      lgtoken:
        loginToken,

      format: "json"
    })
  );

  console.log(
    "Wikipedia Login erfolgreich"
  );

  return client;
}

async function getClient() {

  if (!client) {

    await createClient();
  }

  return client;
}

module.exports = {
  getClient
};