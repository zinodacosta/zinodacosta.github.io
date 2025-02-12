let timeInHours = 1 / 3600; //1 Std in 1 Sekunde

class photovoltaik {
  constructor() {
    this.power = 250; //Watt
    this.efficiency = 0.2;
  }

  async checkforSun() {
    const apiKey = "e7c7b0c5b06544339dd03539253001";
    const city = "Frankfurt";
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
      document.getElementById("battery-level").innerHTML =
        this.storage.toFixed(2) + "kWh";
    }// else {
      //document.getElementById("battery-level").textContent = "Battery is full";
    //}
  }
}

class fuelcell {
  constructor() {
    this.efficiency = 0.9; //%
    this.power = 500; //W
  }
}
class electrolyzer {
  constructor() {
    this.efficiency = 0.7; //%
    this.power = 200; //W
  }
  async produceHydrogen() {
    if (charge.storage > 0) {
      this.storage += 0.01 * this.efficiency * timeInHours;
      document.getElementById("hydrogen-level").innerHTML =
        this.storage.toFixed(2) + "kg";
    } else if (this.storage < this.capacity) {
      document.getElementById("hydrogen-level").innerHTML =
        "Hydrogen Storage is full";
    } else {
      document.getElementById("hydrogen-level").innerHTML = "Battery is empty";
    }
  }
}

class powersource {
  constructor() {
    this.totalpower = 1000; //W
  }
  async totalWattConsumption() {
    let powerconsumption = this.totalpower - pem.power;
    document.getElementById("power-consumption").innerHTML =
      powerconsumption.toFixed(2) + "W";
  }
}

const pv = new photovoltaik();
const charge = new battery();
const pem = new electrolyzer();

async function getLastWholeSalePrice() {
  try {
    const response = await fetch("http://localhost:3000/get-wholesale-price");
    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error("Error fetching Last Price", error);
    return null;
  }
}

async function fetchBatteryLevel() {
  try {
    const response = await fetch("http://localhost:3000/getBatteryStatus");
    const data = await response.json();

    if (data.level !== undefined) {
      charge.storage = data.level; // Batterie-Speicher synchronisieren
      document.getElementById(
        "battery-level"
      ).innerText = `Batterie: ${data.level.toFixed(2)} kWh`;
    }
  } catch (error) {
    console.error("Fehler beim Abrufen des Batterielevels:", error);
  }
}

class tradeElectricity {
  constructor() {
    this.electricityPrice = null;
    this.money = 0;
    this.init();
  }

  async init(){
    await this.priceCheck();
  }
  async priceCheck() {
    this.electricityPrice = await getLastWholeSalePrice();
    console.log("Preis in der Simulation geladen", this.electricityPrice);
    document.getElementById("current-price").innerHTML =
      this.electricityPrice + "€/MWh";

    if (this.electricityPrice > 150) {
      document.getElementById("buying-price").innerHTML =
        "Current Price is over threshold -> sell electricity";
      if (charge.storage != 0) {
        charge.storage -= 1;
        this.money += this.electricityPrice * 0.1;
        document.getElementById("money").innerHTML = " : " + this.money + " €";
      }
    }
    if (this.electricityPrice < 80) {
      document.getElementById("buying-price").innerHTML =
        "Current Price is under threshold -> buy electricity";
      charge.storage += 1;
      this.money -= this.electricityPrice * 0.1;
      document.getElementById("money").innerHTML = " : " + this.money + " €";
    }
    if (this.electricityPrice < 150 && this.electricityPrice > 80) {
      document.getElementById("buying-price").innerHTML =
        "Current Price is within threshold -> doing nothing";
      document.getElementById("money").innerHTML = " : " + this.money + " €";
    }
    return this.electricityPrice;
  }
  
  async buyElectricity() {
    if (charge.storage < charge.capacity) {
      if (this.electricityPrice === null || isNaN(this.electricityPrice)) {
        await this.priceCheck();
        return;
      }
      console.log("Bought 0.1kWh");
      this.money -= this.electricityPrice * 0.1;
      charge.updateBatteryStorage(0.1);
      document.getElementById("money").innerHTML = " : " + this.money.toFixed(2) + " €";
    }
  }
  async sellElectricity() {
    if (charge.storage > 0.1) {
      if (this.electricityPrice === null || isNaN(this.electricityPrice)) {
        await this.priceCheck();
        return;
      }
      console.log("Sold 0.1kWh");
      this.money += this.electricityPrice * 0.1;
      charge.updateBatteryStorage(-0.1);
      document.getElementById("money").innerHTML = " : " + this.money.toFixed(2) + " €";
    }
  }
}
let trade = new tradeElectricity();

async function updateSimulation() {
  let sun = await pv.checkforSun();
  if (sun) {
    let powergenerated = pv.efficiency * pv.power * timeInHours;
    charge.updateBatteryStorage(powergenerated);
  }

  // Sende den aktualisierten Batteriestand an den Server
  try {
    const response = await fetch("http://localhost:3000/saveBatteryStatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ batteryLevel: charge.storage }),
    });

    if (response.ok) {
      console.log("Battery level saved to DB");
    } else {
      console.error("Failed to save battery level");
    }
  } catch (error) {
    console.error("Error sending battery level to server:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const sellButton = document.getElementById("sell-button");
  const buyButton = document.getElementById("buy-button");

  if (sellButton) {
    sellButton.addEventListener("click", trade.sellElectricity.bind(trade));
  }
  if (buyButton) {
    buyButton.addEventListener("click", trade.buyElectricity.bind(trade));
  }
});

// Start-Synchronisation nur einmal beim Laden
fetchBatteryLevel();

// Regelmäßige Updates laufen nur über updateSimulation()
setInterval(updateSimulation, 1000);
