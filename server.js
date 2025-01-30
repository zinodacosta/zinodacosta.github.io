import express from "express";
import fetch from "node-fetch"; // http req lib
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs"; // read and write files
import sqlite3 from "sqlite3"; // SQLite database

// Correct `__dirname` for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const counterFilePath = path.join(__dirname, "counter.json"); // Path to counter.json

const app = express(); // Initializing app on port 3000
const port = 3000;

// Path to `config.txt`
const configPath = path.join(__dirname, "config.txt");

// Path to the JSON file with graph identifiers
const graphIdentifiersPath = path.join(
  __dirname,
  "public",
  "graphIdentifiers.json"
);

// Load graph identifiers from the JSON file
let graphIdentifiers = {};
try {
  graphIdentifiers = JSON.parse(fs.readFileSync(graphIdentifiersPath, "utf-8")); // Parsing from JSON
  console.log("Graph Identifiers:", graphIdentifiers); // For verification
} catch (err) {
  console.error("Error loading graph identifiers:", err.message);
  process.exit(1);
}

// Serve static files from public folder directory
app.use(express.static(path.join(__dirname, "public")));

// Initialize SQLite database
const db = new sqlite3.Database("energy_system.db", (err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

// Create a table to store the data (if it doesn't exist)
db.run(
  `
    CREATE TABLE IF NOT EXISTS time_series_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        graphId TEXT NOT NULL,
        nextTimestamp INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        value REAL
    )
`,
  (err) => {
    if (err) {
      console.error("Error creating table:", err);
    } else {
      console.log("Table created or already exists.");
    }
  }
);

// Function to save time series data to the database
function saveToDatabase(graphId, nextTimestamp, series) {
  graphId = 4169;
  const query = `
    INSERT INTO time_series_data (graphId, nextTimestamp, timestamp, value)
    VALUES (?, ?, ?, ?)
  `;

  series.forEach(([timestamp, value]) => {
    db.run(
      query,
      [graphId, nextTimestamp, new Date(timestamp).toISOString(), value],
      (err) => {
        if (err) {
          console.error("Error inserting data into the database:", err);
        } else {
          console.log("Data inserted:", { graphId, nextTimestamp, timestamp, value });
        }
      }
    );
  });
}

// Function to initialize the counter
function initCounter() {
  let counterData = { counter: 0, lastUpdate: null };

  try {
    counterData = JSON.parse(fs.readFileSync(counterFilePath, "utf-8"));
  } catch (err) {
    console.log("init to 0");
  }

  const currentDate = new Date().toISOString().split("T")[0];

  // Check if the last update date is different from today
  if (counterData.lastUpdate !== currentDate) {
    // Increment the counter and reset it after reaching 7
    counterData.counter = counterData.counter + 1;

    if (counterData.counter > 6) {
      counterData.counter = 0;
      console.log("Counter reset");
    }
    // Update the `lastUpdate` to today
    counterData.lastUpdate = currentDate;
    console.log(
      `Counter updated to ${counterData.counter} for date: ${currentDate}`
    );
  } else {
    console.log(`Counter remains unchanged at ${counterData.counter}`);
  }

  // Save updated counter data back to `counter.json`
  fs.writeFileSync(counterFilePath, JSON.stringify(counterData, null, 2), "utf-8");
  return counterData.counter;
}

// Function: Get the next day timestamp (adjusted)
function getNextDayTimestamp() {
  const today = new Date();
  const counter = initCounter();
  today.setUTCHours(0, 0, 0, 0); // Set time to 00:00 UTC
  today.setUTCDate(today.getUTCDate() - counter); // Move to the days before
  const nextDayTimestamp = today.getTime(); // Get timestamp in milliseconds
  const adjustedTimestamp = nextDayTimestamp - 3600000; // Adjust timestamp by 1 hour
  console.log("Next Day Timestamp:", nextDayTimestamp);
  console.log("Adjusted Timestamp:", adjustedTimestamp);
  return adjustedTimestamp;
}

// Endpoint: Provide API data
app.get("/data", async (req, res) => {
  try {
    // Get the graph type or ID from the query parameter
    const requestedGraphType = req.query.graphType || "wholesalePrice";
    console.log("Requested Graph Type/ID:", requestedGraphType);

    // Reverse lookup if the graphType is provided as an ID
    let graphKey = Object.keys(graphIdentifiers).find(
      (key) => graphIdentifiers[key].id === requestedGraphType
    );

    // If the reverse lookup fails, assume the graphType is provided as a key
    if (!graphKey) {
      graphKey = requestedGraphType;
    }

    // Validate the resolved graphKey
    const graphData = graphIdentifiers[graphKey];
    if (!graphData) {
      throw new Error("Invalid graph type specified.");
    }

    // Get the ID from the selected graph data
    const graphId = graphData.id;

    // Calculate the timestamp for the next day at 00:00 UTC
    const nextTimestamp = getNextDayTimestamp();

    // Construct the API URL with the dynamic timestamp and graph identifier
    const dynamicApiUrl = `https://www.smard.de/app/chart_data/${graphId}/DE/${graphId}_DE_hour_${nextTimestamp}.json`;
    console.log("Dynamic API URL:", dynamicApiUrl);

    const response = await fetch(dynamicApiUrl); // Fetch data from the dynamic API URL
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const rawData = await response.json(); // Read the API data

    // Transform the time series data
    const transformedData = {
      labels: rawData.series.map((entry) => new Date(entry[0]).toLocaleString()), // Format timestamps
      values: rawData.series.map((entry) => entry[1]), // Extract values
    };

    // Save the transformed data to the database
    //saveToDatabase(graphId, nextTimestamp, rawData.series);

    res.json(transformedData); // Send data to the frontend
  } catch (error) {
    console.error("Error in /data route:", error.message);
    res.status(500).json({ error: "Error fetching data" });
  }
});

// Endpoint: Provide graph identifiers
app.get("/graphIdentifiers", (req, res) => {
  res.json(graphIdentifiers); // Send graph identifiers to the frontend
});

// Index page
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Error loading index page:", err);
      res.status(500).send("Error loading the page.");
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});