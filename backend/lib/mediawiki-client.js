require("dotenv")
  .config();
// needs
// MEDIAWIKI_PASSWORD
// MEDIAWIKI_USERNAME


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
  console.log ( process.env
           .MEDIAWIKI_USERNAME)

                    
    if (
    ! process.env
           .MEDIAWIKI_USERNAME ||
    ! process.env
           .MEDIAWIKI_PASSWORD
    )
    {
    throw new Error(
        "MEDIAWIKI_USERNAME oder MEDIAWIKI_PASSWORD fehlt"
    );
    }


    
  const jar =
    new CookieJar();


  client =
    wrapper(
      axios.create({
        headers: {
        "User-Agent":
            "ZeitzeugenBot/1.0 (private research project; mail@example.de)"
        },

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
try{
  const loginResponse =    
  await client.post(
    WIKI_API,
    new URLSearchParams({

      action: "login",

      lgname:
         process.env
           .MEDIAWIKI_USERNAME,

      lgpassword:
        process.env
          .MEDIAWIKI_PASSWORD,

      lgtoken:
        loginToken,

      format: "json"
    })
  );


console.log(
  JSON.stringify(
    loginResponse.data,
    null,
    2
  )
);
}
catch (err){
    if (err.response) {

    console.log(
        "Status:",
        err.response.status
    );

    console.log(
        err.response.data
    );
    throw err
    }

}



  console.log(
    "Wikipedia Login erfolgreich"
  );

  return client;
}

async function getClient() {

  if (!client) {
   try{
    await createClient();
   } catch (err) {

    console.log(err)
    throw err
   }
  }

  return client;
}

module.exports = {
  getClient
};