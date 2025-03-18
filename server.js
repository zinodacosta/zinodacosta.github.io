import express from "express";
import fetch from "node-fetch"; //http req lib
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs"; //read and write files
import { saveBatteryStatus, getLastBatteryStatus, saveHydrogenStatus, getLastHydrogenStatus } from './public/js/db.js'; //Verwende import
import { saveWholeSalePrice } from "./public/js/db.js"; 
import { getLastWholeSalePrice } from "./public/js/db.js"; 


//Correct `__dirname` for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const counterFilePath = path.join(__dirname, "counter.json"); //Path to counter.json

const app = express(); //Initializing app on port 3000
const port = 3000;

//Path to `config.txt`
const configPath = path.join(__dirname, "config.txt");

//Middleware, um JSON-Daten aus dem Body zu parsen
app.use(express.json()); //Ab Express v4.16.0 (neue Methode, bevorzugt)

//Path to the JSON file with graph identifiers
const graphIdentifiersPath = path.join(
  __dirname,
  "public",
  "graphIdentifiers.json"
);

//Load graph identifiers from the JSON file
let graphIdentifiers = {};
try {
  graphIdentifiers = JSON.parse(fs.readFileSync(graphIdentifiersPath, "utf-8")); //Parsing from JSON
  console.log("Graph Identifiers:", graphIdentifiers); //For verification
} catch (err) {
  console.error("Error loading graph identifiers:", err.message);
  process.exit(1);
}

//Serve static files from public folder directory
app.use(express.static(path.join(__dirname, "public")));


//Function to initialize the counter
function initCounter() {
  let counterData = { counter: 0, lastUpdate: null };

  try {
    counterData = JSON.parse(fs.readFileSync(counterFilePath, "utf-8"));
  } catch (err) {
    console.log("init to 0");
  }

  const currentDate = new Date().toISOString().split("T")[0];

  //Check if the last update date is different from today
  if (counterData.lastUpdate !== currentDate) {
    //Increment the counter and reset it after reaching 7
    counterData.counter = counterData.counter + 1;

    if (counterData.counter > 5) {
      counterData.counter = 0;
      console.log("Counter reset");
    }
    //Update the `lastUpdate` to today
    counterData.lastUpdate = currentDate;
    console.log(
      `Counter updated to ${counterData.counter} for date: ${currentDate}`
    );
  } else {
    console.log(`Counter remains unchanged at ${counterData.counter}`);
  }

  //Save updated counter data back to `counter.json`
  fs.writeFileSync(counterFilePath, JSON.stringify(counterData, null, 2), "utf-8");
  return counterData.counter;
}

//Function: Get the next day timestamp (adjusted)
function getNextDayTimestamp() {
  const today = new Date();
  const counter = initCounter();
  today.setUTCHours(0, 0, 0, 0); //Set time to 00:00 UTC
  today.setUTCDate(today.getUTCDate() - counter); //Move to the days before
  const nextDayTimestamp = today.getTime(); //Get timestamp in milliseconds
  const adjustedTimestamp = nextDayTimestamp - 3600000; //Adjust timestamp by 1 hour
  console.log("Next Day Timestamp:", nextDayTimestamp);
  console.log("Adjusted Timestamp:", adjustedTimestamp);
  return adjustedTimestamp;
}

app.post("/saveBatteryStatus", async (req, res) => {
  const { batteryLevel } = req.body;

  if (batteryLevel === null || batteryLevel === undefined || isNaN(batteryLevel)) {
    return res.status(400).json({ error: "Invalid battery level" });
  }

  try {
    //Save the battery level to the database
    await saveBatteryStatus(batteryLevel);
    res.status(200).json({ message: "Battery status saved successfully" });
  } catch (error) {
    console.error("Error saving battery status:", error);
    res.status(500).json({ error: "Error saving battery status" });
  }
});

app.post("/saveHydrogenStatus", async (req, res) => {
  const { hydrogenLevel } = req.body;

  try {
    //Speichere den Batteriestand in der Datenbank
    await saveHydrogenStatus(hydrogenLevel);
    res.status(200).json({ message: "Hydrogen status saved successfully" });
  } catch (error) {
    console.error("Error saving hydrogen status:", error);
    res.status(500).json({ error: "Error saving hydrogen status" });
  }
});

function getCurrentHourTimestamp() {
  const now = new Date(); //Aktuelle Zeit

  //Setze Minuten, Sekunden und Millisekunden auf null
  now.setMinutes(0, 0, 0);

  //Wenn die aktuelle Minute nicht 0 ist, runde auf die nächste Stunde auf
  if (now.getMinutes() !== 0) {
    now.setHours(now.getHours() + 1);
  }

  //Hole den Timestamp der nächsten vollen Stunde
  const roundedTimestamp = now.getTime();
  console.log("Rounded Current Hour Timestamp:", roundedTimestamp);
  return roundedTimestamp;
}

//Funktion zum Abrufen und Speichern des Preises
async function fetchAndSaveWholesalePrice() {
  const adjustedTimestamp = getNextDayTimestamp();
  const currentTimestamp = getCurrentHourTimestamp();

  try {
    //Abruf der Wholesale-Preisliste von der API
    const response = await fetch(`https://www.smard.de/app/chart_data/4169/DE/4169_DE_hour_${adjustedTimestamp}.json`);
    if (!response.ok) {
      throw new Error("Failed to fetch wholesale price from the external API");
    }

    //Extrahiere den Preis aus der API-Antwort
    const data = await response.json();

    //Prüfen, ob die Antwort das richtige Format hat
    if (data && data.series && Array.isArray(data.series)) {
      //Wenn die Antwort eine series enthält und diese ein Array ist, verwenden wir die series
      const series = data.series;

      //Filtern der Einträge, bei denen der Wert nicht null ist
      const validEntries = series.filter(entry => entry[1] !== null); //Entferne alle Einträge mit null als Wert

      //Überprüfen, ob wir überhaupt gültige Einträge haben
      if (validEntries.length === 0) {
        throw new Error("No valid price data found for the current timestamp.");
      }

      //Suche nach dem gültigen Eintrag für den aktuellen Timestamp oder den nächstgelegenen gültigen Eintrag
      let lastEntry = validEntries.find(entry => entry[0] === currentTimestamp);

      //Wenn kein Eintrag für den aktuellen Timestamp gefunden wurde, nehme den letzten gültigen Preis
      if (!lastEntry) {
        lastEntry = validEntries[validEntries.length - 1]; //Nimm den letzten gültigen Eintrag
      }

      const price = lastEntry[1]; //Der Wert des letzten gültigen Eintrags
      const priceTimestamp = lastEntry[0]; //Der Timestamp des letzten gültigen Eintrags

      //Speichern des Preises in der DB
      await saveWholeSalePrice(priceTimestamp, price);

    } else {
      throw new Error("API response does not have a valid 'series' array");
    }
  } catch (error) {
    console.error("Error fetching or saving wholesale price:", error);
    throw new Error("Error saving price");
  }
}


app.get("/get-wholesale-price", async (req, res) => {
  try {
    //Hole den gespeicherten Wert aus der Datenbank oder der Datei
    const priceData = await getLastWholeSalePrice();
    res.json(priceData); //Schicke den Wert als JSON zurück
  } catch (error) {
    console.error("Error fetching wholesale price:", error);
    res.status(500).json({ error: "Error fetching wholesale price" });
  }
});


app.post("/saveWholeSalePrice", async (req, res) => {
  const { timestamp, value } = req.body;
  

  if (typeof timestamp !== "number") {
      return res.status(400).json({ error: "Invalid timestamp" });
  }
  if (typeof value !== "number") {
      return res.status(400).json({ error: "Invalid value" });
  }

  try {
      await saveWholeSalePrice(timestamp, value);  //Speichern in der Datenbank
      res.status(200).json({ message: "Timestamp and value saved successfully" });
  } catch (error) {
      console.error("Error saving timestamp or value", error);
      res.status(500).json({ error: "Error" });
  }
});




//Endpoint: Provide API data
app.get("/data", async (req, res) => {
  try {
    //Get the graph type or ID from the query parameter
    const requestedGraphType = req.query.graphType || "wholesalePrice";
    console.log("Requested Graph Type/ID:", requestedGraphType);

    //Reverse lookup if the graphType is provided as an ID
    let graphKey = Object.keys(graphIdentifiers).find(
      (key) => graphIdentifiers[key].id === requestedGraphType
    );

    //If the reverse lookup fails, assume the graphType is provided as a key
    if (!graphKey) {
      graphKey = requestedGraphType;
    }

    //Validate the resolved graphKey
    const graphData = graphIdentifiers[graphKey];
    if (!graphData) {
      throw new Error("Invalid graph type specified.");
    }

    //Get the ID from the selected graph data
    const graphId = graphData.id;

    //Calculate the timestamp for the next day at 00:00 UTC
    const nextTimestamp = getNextDayTimestamp();

    //Construct the API URL with the dynamic timestamp and graph identifier
    const dynamicApiUrl = `https://www.smard.de/app/chart_data/${graphId}/DE/${graphId}_DE_hour_${nextTimestamp}.json`;
    console.log("Dynamic API URL:", dynamicApiUrl);

    const response = await fetch(dynamicApiUrl); //Fetch data from the dynamic API URL
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const rawData = await response.json(); //Read the API data

    //Transform the time series data
    const transformedData = {
      labels: rawData.series.map((entry) => new Date(entry[0]).toLocaleString()), //Format timestamps
      values: rawData.series.map((entry) => entry[1]), //Extract values
    };

    //Save the transformed data to the database
    //saveToDatabase(graphId, nextTimestamp, rawData.series);

    res.json(transformedData); //Send data to the frontend
  } catch (error) {
    console.error("Error in /data route:", error.message);
    res.status(500).json({ error: "Error fetching data" });
  }
});

//Endpoint: Provide graph identifiers
app.get("/graphIdentifiers", (req, res) => {
  res.json(graphIdentifiers); //Send graph identifiers to the frontend
});

//Index page
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Error loading index page:", err);
      res.status(500).send("Error loading the page.");
    }
  });
});

//Route zum Abrufen des letzten Batterielevels
app.get("/getBatteryStatus", async (req, res) => {
  try {
    const lastBatteryStatus = await getLastBatteryStatus();
    if (!lastBatteryStatus) {
      return res.status(404).json({ error: "No battery data found" });
    }
    res.status(200).json(lastBatteryStatus);
  } catch (error) {
    console.error("Error fetching battery status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Route zum Abrufen des letzten Hydrogenlevels
app.get("/getHydrogenStatus", async (req, res) => {
  try {
    const lastHydrogenStatus = await getLastHydrogenStatus();
    if (!lastHydrogenStatus) {
      return res.status(404).json({ error: "No hydrogen data found" });
    }
    res.status(200).json(lastHydrogenStatus);
  } catch (error) {
    console.error("Error fetching hydrogen status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Start server
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);

  //price check on startup and save to db
  try {
    await fetchAndSaveWholesalePrice(); //Funktion, die die Preisabruf-Logik enthält
  } catch (error) {
    console.error("Error saving price on server startup:", error);
  }
});