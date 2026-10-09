const express = require("express");
const cors = require("cors");

const {
  findPerson,
  getPersonDetails
} = require("./wikidata");

const app = express();

app.use(cors());

app.get("/api/person/:name", async (req, res) => {
  try {
    const person = await findPerson(req.params.name);

    if (!person) {
      return res.status(404).json({
        error: "Person nicht gefunden"
      });
    }

    res.json(person);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.get("/api/details/:qid", async (req, res) => {
  try {
    const details = await getPersonDetails(req.params.qid);
    res.json(details);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.listen(3001, () => {
  console.log("BestBuddies API läuft auf Port 3001");
});