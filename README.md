Hydrogen Dashboard to get data for power creation and usage from SMARD API, display it graphically and analyze it to compare it with hydrogen as fuel source.

Features Simulation with Charging Photovoltaik, Battery, Hydrogen Electrolyzer and Fuel Cell

Concept:

Essentially, this Simulation is based on buying/selling electricity when the market price reaches a set threshold and respectively converting electricity into hydrogen and converting hydrogen back into electricity
for monetary gains. This has been kept as primitive as possible including efficiency and power of machinery, yet eliminating any implementation of losses for example due to machine start-up, or any other losses tied to the actual buying and selling of electricity (for now). 

File Explanation: 

simulation.js holds the entirety of the Hydrogen Eco System tied to object-oriented programming 
server.js is responsible for all the app.get and app.post requests acting as back-end
main.js is merely used to create the various charts visible on the homepage acting as front-end
db.js connects to InfluxDB and queries the battery, hydrogen and wholesale price to the database
graphIdentifiers.json states all the possible filtering options for the power generation graph
counter.json just acts as a counter to correctly work the SMARD API

Chart.js is used to create the charts for the frontend
InfluxDB has been implemented as database service, which will probably only be useful for personal use, as for commercial use the database will be scraped entirely and the simulation will just be instanced client sided.

API:

The SMARD API (https://www.smard.de) is tricky to evaluate. The URL is filtered after power source, region and resolution, but the timestamp only changes every week at 11pm, meaning logic had to be implemented that dynamically shifts the timestamp after every week.

Data delivered by the SMARD API can be filled with null entries, which have to be filtered out in order for the automated buy and sell logic to work as intended. Furthermore the price can drop down to a negative value, meaning electricity provider pay to sell their money resulting in a negative value, which has to be accounted for when buying, elsewise money will be deducted.

WeatherAPI (https://www.weatherapi.com/) is used to check the current weather state and if the sun can charge the photovoltaik.

ElectricityMaps (https://portal.electricitymaps.com/) is used to get the current local carbon intensity.


