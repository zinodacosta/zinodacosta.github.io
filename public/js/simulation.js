let timeInHours = 1 / 3600; //1 Std in 1 Sekunde
import { getLastWholeSalePrice } from "./db.js"; 

class photovoltaik {
  constructor() {
    this.power = 250; //Watt
    this.efficiency = 0.2;
  }

  async checkforSun() {
    const apiKey = "e7c7b0c5b06544339dd03539253001";
    const city = "Luanda";
    document.getElementById("location").innerHTML = city;
    let sun = false;
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`
      );
      const data = await response.json();
      const cloudiness = data.current.cloud;
      const daytime = data.current.is_day;
      if (daytime == true) {
        if (cloudiness < 20) {
          document.getElementById("sun").textContent =
            "Sun is shining. PV charging";
          sun = true;
        } else {
          document.getElementById("sun").textContent =
            "It is cloudy. PV not charging";
          sun = false;
        }
      } else {
        document.getElementById("sun").textContent =
          "It is night-time. PV not charging";
        sun = false;
      }
      return sun;
    } catch (error) {
      console.error("Error", error);
    }
  }
}

class battery {
  constructor() {
    this.capacity = 5; //kWh maximaler Füllstand
    this.storage = 0; //kWh aktueller Füllstand
  }

  updateBatteryStorage(amount) {
    if (this.storage < this.capacity) {
      this.storage += amount;
      document.getElementById("battery-level").innerHTML = this.storage.toFixed(2) + "kWh";
    } else {
      document.getElementById("battery-level").textContent = "Battery is full";
    }
  }
}

class electrolyzer{
  constructor(){
    this.efficiency = 0.7; //%
    this.storage = 0; //kg
    this.capacity = 10; //kg
    this.power = 200; //W


  }
}


class powersource{
  constructor(){
    this.totalpower = 1000; //W
  }
  async totalWattConsumption(){
    let powerconsumption = this.totalpower - pem.power;
    document.getElementById("power-consumption").innerHTML = powerconsumption.toFixed(2) + "W";
  }
  async produceHydrogen(){
    if(charge.storage>0){
      this.storage += 0.01 * this.efficiency * timeInHours;
      document.getElementById("hydrogen-level").innerHTML = this.storage.toFixed(2) + "kg";
    }
    else if(this.storage < this.capacity){
      document.getElementById("hydrogen-level").innerHTML = "Hydrogen Storage is full";
    }
    else{
      document.getElementById("hydrogen-level").innerHTML = "Battery is empty";
    }
   }
}


const pv = new photovoltaik();
const charge = new battery();
const pem = new electrolyzer();



async function updateSimulation() {
  let sun = await pv.checkforSun();
  if (sun) {
    let powergenerated = pv.efficiency * pv.power * timeInHours;
    charge.updateBatteryStorage(powergenerated);
  }
    // Hole den letzten Wholesale-Preis von der Datenbank
    try {
      const lastPriceData = await getLastWholeSalePrice();
      const lastPrice = lastPriceData.value;
      const lastTimestamp = lastPriceData.timestamp;

      console.log('Last Wholesale Price:', lastPrice);
      console.log('Timestamp:', lastTimestamp);

      // Hier kannst du den Wert weiter verwenden, z.B. in einer Berechnung oder Anzeige
      document.getElementById("wholesale-price").innerHTML = lastPrice.toFixed(2) + " €";

    } catch (error) {
      console.error('Error fetching last wholesale price:', error);
    }

    // Sende den Batteriestand an den Server
    try {
      const response = await fetch('http://localhost:3000/saveBatteryStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batteryLevel: charge.storage }),
      });

      if (response.ok) {
        console.log('Battery level saved to DB');
      } else {
        console.error('Failed to save battery level');
      }
    } catch (error) {
      console.error('Error sending battery level to server:', error);
    }

}

setInterval(updateSimulation, 1000);