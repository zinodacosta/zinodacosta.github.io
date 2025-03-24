Hydrogen Dashboard to get data for power creation and usage from SMARD API, display it graphically and analyze it to compare it with hydrogen as fuel source.

Features Simulation with Charging Photovoltaik, Battery, Hydrogen Electrolyzer and Fuel Cell

The SMARD API (https://www.smard.de)is tricky to evaluate . The URL is filtered after power source, region and resolution, but the timestamp only changes every week at 11pm, meaning logic had to be implemented that dynamically shifts the timestamp after every week.

Chart.js is used to create the charts for the frontend
InfluxDB has been implemented as database service, which will probably only be useful for personal use, as for commercial use the database will be scraped entirely and the simulation will just be instanced client sided.
WeatherAPI (https://www.weatherapi.com/) is used to check the current weather state and if the sun can charge the photovoltaik.

Battery Level, Hydrogen Level and latest Wholesale Price is sent to the database 

Sometimes data delivered by the SMARD API are filled with null entries, which have to be filtered out in order for the automated buy and sell logic to work as intended. Furthermore the price drops down to a negative value, meaning electricity provider pay to sell their money resulting in a negative value, which has to be accounted for when buying, elsewise money will be deducted.


