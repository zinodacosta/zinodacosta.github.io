//Setting up node.js server using express framework

import express from 'express';
import fetch from 'node-fetch'; //http req lib
import { fileURLToPath } from 'url'; 
import path from 'path';
import fs from 'fs'; //read and write files

//Correct `__dirname` for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); //initializing app on port 3000
const port = 3000;

//Path to `config.txt`
const configPath = path.join(__dirname, 'config.txt');

//Path to the JSON file with graph identifiers
const graphIdentifiersPath = path.join(__dirname, 'public', 'graphIdentifiers.json');

//Load graph identifiers from the JSON file
let graphIdentifiers = {};
try {
    graphIdentifiers = JSON.parse(fs.readFileSync(graphIdentifiersPath, 'utf-8')); //Parsing from JSON
    console.log('Graph Identifiers:', graphIdentifiers); //For verification
} catch (err) {
    console.error('Error loading graph identifiers:', err.message);
    process.exit(1);
}

//Serve static files from public folder directory
app.use(express.static(path.join(__dirname, 'public')));

//Function: Get the next day timestamp (adjusted)
//SMARD API is only updated every few days if today is 23/1/2025 4pm we have to use the API url from 19/1/2025 11pm
function getNextDayTimestamp() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); //Set time to 00:00 UTC
    today.setUTCDate(today.getUTCDate() - 4); //Move to the days before this is a bit tricky because the variable increments
    //each day until 3 and then goes back to 0 so we probably have to implement a system were it increments after a day until x? and then gets set to 0 again
    const nextDayTimestamp = today.getTime(); //Get timestamp in milliseconds
    const adjustedTimestamp = nextDayTimestamp - 3600000; //Adjust timestamp by 1 hour
    console.log('Next Day Timestamp:', nextDayTimestamp);
    console.log('Adjusted Timestamp:', adjustedTimestamp);
    return adjustedTimestamp;
}


//Endpoint: Provide API data
app.get('/data', async (req, res) => {
    try {
        //Get the graph type or ID from the query parameter
        const requestedGraphType = req.query.graphType || "wholesalePrice";
        console.log('Requested Graph Type/ID:', requestedGraphType);

        //Reverse lookup if the graphType is provided as an ID
        let graphKey = Object.keys(graphIdentifiers).find(
            key => graphIdentifiers[key].id === requestedGraphType
        );

        //If the reverse lookup fails assume the graphType is provided as a key
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
        console.log('Dynamic API URL:', dynamicApiUrl);

        const response = await fetch(dynamicApiUrl); //Fetch data from the dynamic API URL
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const rawData = await response.json(); //Read the API data

        //Transform the time series data
        const transformedData = {
            labels: rawData.series.map(entry => new Date(entry[0]).toLocaleString()), //Format timestamps
            values: rawData.series.map(entry => entry[1]) //Extract values
        };

        res.json(transformedData); //Send data to the frontend
    } catch (error) {
        console.error('Error in /data route:', error.message);
        res.status(500).json({ error: 'Error fetching data' });
    }
    const lastentry = getLastEntry();
});
//create function to pass api data from wholesale price and get to the last entry to use as buy/sell calc
async function getLastEntry(){
    const nextTimestamp = getNextDayTimestamp();
    const calcApiUrl = `https://www.smard.de/app/chart_data/4169/DE/4169_DE_hour_${nextTimestamp}.json`;
    try{
        const response = await fetch(calcApiUrl); //Fetch from url 
        const data = await response.json();
        //filtering out all entries that are NULL
    if(data && data.series){
        const filteredData = data.series.filter(entry => entry[1] !== null);
        const lastEntry = filteredData[filteredData.length-1];
        console.log("This is the latest value of the wholesale price:", lastEntry)
        return lastEntry;
    }else{
        console.log("unexpected data format:", data);
    }
    }catch(error){
        console.error("Error in getLastEntry: ", error.message);
    }
    return null;
}
//Endpoint: Provide graph identifiers
app.get('/graphIdentifiers', (req, res) => {
    res.json(graphIdentifiers); //Send graph identifiers to the frontend
});

//Index page
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error loading index page:', err);
            res.status(500).send('Error loading the page.');
        }
    });
});

//Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});