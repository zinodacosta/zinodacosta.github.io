// simulation.js

let timeInHours = 1 / 3600; // Zeit in 5 Sekunden



class photovoltaik {
  constructor() {
    this.power = 250; // Watt
    this.efficiency = 0.2;
  }

  async checkforSun() {
    const apiKey = "e7c7b0c5b06544339dd03539253001";
    const city = "New York";
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
    this.capacity = 5; // kWh maximaler Füllstand
    this.storage = 0; // kWh aktueller Füllstand
  }

  updateBatteryStorage(amount) {
    if (this.storage < this.capacity) {
      this.storage += amount;
      document.getElementById("battery-level").innerHTML = + this.storage.toFixed(2) + "kWh";
    } else {
      document.getElementById("battery-level").textContent = "Battery is full";
    }
  }
}



const pv = new photovoltaik();
const charge = new battery();

async function updateSimulation() {
  let sun = await pv.checkforSun();
  if (sun) {
    let powergenerated = pv.efficiency * pv.power * timeInHours;
    charge.updateBatteryStorage(powergenerated);

    // Sende den Batteriestand an den Server (Backend)
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
}




setInterval(updateSimulation, 1000);
