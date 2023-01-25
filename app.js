const express = require("express");
const { open } = require("sqlite");
const app = express();
const path = require("path");
const sqlite3 = require("sqlite3");
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Localhost success http://localhost:3000/states/");
    });
  } catch (error) {
    console.log(`dbError: ${error.message}`);
    process.exit(1);
  }
};

initializeDatabase();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//get covid case API 1
app.get("/states/", async (request, response) => {
  const covidDetails = "SELECT * FROM state";
  const covidCase = await db.all(covidDetails);
  response.send(
    covidCase.map((covid) => convertDbObjectToResponseObject(covid))
  );
});

//get states by Id API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateById = `SELECT * FROM state WHERE state_id = ${stateId}`;

  const covidState = await db.get(stateById);
  response.send(convertDbObjectToResponseObject(covidState));
});

//create table API 3
//db = new sqlite3.Database("covid19India.db");
app.post("/districts/", async (request, response) => {
  const { districtId } = request.params;
  const crateTable = `CREATE TABLE district (district_name TEXT, state_id INTEGER, cases INTEGER, cured INTEGER, active INTEGER, deaths INTEGER) WHERE district_id = ${districtId};`;

  await db.run(crateTable);
  response.send("District Successfully Added");
});

//GET by ids API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const baseOnId = `SELECT * FROM district WHERE district_id = ${districtId}`;
  const detailsById = await db.get(baseOnId);
  response.send(convertDbObjectToResponseObject(detailsById));
});

//delete district API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteState = `DELETE FROM district WHERE district_id = ${districtId}`;
  await db.run(deleteState);
  response.send("District Removed");
});

//update district API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;

  const updateDetails = `
  UPDATE district SET district_name = '${districtName}', state_id = ${stateId},cases = ${cases}, cured = ${cured},active = ${active},deaths = ${deaths}
        WHERE district_id = ${districtId};`;

  await db.run(updateDetails);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `SELECT 
    SUM(cases) AS totalCases ,SUM(cured) AS totalCured,SUM(active) AS totalActive,SUM(deaths) AS totalActive FROM district WHERE state_id = ${stateId};`;

  const stats = await db.all(getStatsQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateName = `SELECT state_name FROM district NATURAL JOIN  state

  WHERE district_id = ${districtId};`;

  const statesNames = await db.all(getStateName);
  console.log(statesNames);
  response.send(
    statesNames.map((eachState) => ({ stateName: eachState.state_name }))
  );
});

module.exports = app;

//ccbp submit NJSCPAQLBE
