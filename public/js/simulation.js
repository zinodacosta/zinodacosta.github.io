let timeInHours = 1 / 3600; //1 Std in 1 Sekunde

export class photovoltaik {
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

export class battery {
  constructor() {
    this.capacity = 5; //kWh maximaler Füllstand
    this.storage = 0; //kWh aktueller Füllstand
  }

  updateBatteryStorage(amount) {
    if (amount > 0 && this.storage < this.capacity) {
      this.storage += amount;
    } else if (amount < 0 && this.storage > 0) {

      this.storage += amount;
    }
    document.getElementById("battery-level").innerHTML =
      this.storage.toFixed(2) + "kWh";
  }
}

export class fuelcell {
  constructor() {
    this.efficiency = 0.9; //%
    this.power = 500; //W
  }
  produceElectricity() {
    if (hydro.storage > 0) {
      let powerProduced = (hydro.storage * 20 * this.efficiency) / 1000; //20kWh pro kg
      charge.updateBatteryStorage(powerProduced);
      hydro.storage = 0; // Wasserstoff wird verbraucht

      document.getElementById("battery-level").innerHTML =
        charge.storage.toFixed(2) + " kWh";
      document.getElementById("hydrogen-level").innerHTML =
        hydro.storage.toFixed(2) + " kWh";
    }
  }
}
export class electrolyzer {
  constructor() {
    this.efficiency = 0.7; //%
    this.power = 200; //W
    this.storage = 0;
    this.capacity = 500;
  }

  produceHydrogen() {
    if (charge.storage > 0.1) {
      // Batterie muss genug Ladung haben
      let hydrogenProduced = + ((charge.storage * this.efficiency) / 55.5) * 1000; // 55.5 kWh/kg H2
      if (this.storage + hydrogenProduced <= this.capacity) {
        this.storage += hydrogenProduced;
        charge.updateBatteryStorage(-charge.storage * this.efficiency); // Entladen der Batterie
        document.getElementById("hydrogen-level").innerHTML =
          this.storage.toFixed(2) + " g";
          
      } else {
        document.getElementById("hydrogen-level").innerHTML =
          "Hydrogen Storage is full";
      }
    } else {
      document.getElementById("hydrogen-level").innerHTML =
        this.storage.toFixed(2) + " g";
    }
  }
}
const pv = new photovoltaik();
const charge = new battery();
const hydro = new electrolyzer();
const fc = new fuelcell();

async function fetchHydrogenLevel() {
  try {
    const response = await fetch("http://localhost:3000/getHydrogenStatus");
    const data = await response.json();

    if (data.level !== undefined && data.level !== null) {
      // Stelle sicher, dass der Wasserstoffstand richtig angezeigt wird
      hydro.storage = data.level;  // Den Wert im electrolyzer-Objekt setzen
      document.getElementById("hydrogen-level").innerText = `Hydrogen: ${hydro.storage.toFixed(2)} g`;
    } else {
      document.getElementById("hydrogen-level").innerText = "No hydrogen data available";
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("hydrogen-level").innerText = "Error fetching hydrogen data";
  }
}

export class powersource {
  constructor() {
    this.totalpower = 1000; //W
  }
  async totalWattConsumption() {
    let powerconsumption = this.totalpower - pem.power;
    document.getElementById("power-consumption").innerHTML =
      powerconsumption.toFixed(2) + "W";
  }
}

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
      ).innerText = `Battery: ${data.level.toFixed(2)} kWh`;
    }
  } catch (error) {
    console.error("error:", error);
  }
}

export class tradeElectricity {
  constructor() {
    this.electricityPrice = null;
    this.money = 0;
    this.init();
  }

  async init() {
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
    return this.electricityPrice;
  }

  async buyElectricity() {
    if (charge.storage + 0.09 < charge.capacity) {
      if (this.electricityPrice === null || isNaN(this.electricityPrice)) {
        await this.priceCheck();
        return;
      }
      console.log("Bought 0.1kWh");
      this.money -= this.electricityPrice * 0.1;
      charge.updateBatteryStorage(0.1);
      document.getElementById("money").innerHTML =
        " : " + this.money.toFixed(2) + " €";
    } else {
      document.getElementById("battery-level").innerHTML = "Can't buy battery is full";
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
      document.getElementById("money").innerHTML =
        " : " + this.money.toFixed(2) + " €";
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
    // Sende den aktualisierten Hydrogenstand an den Server
    try {
      const response = await fetch("http://localhost:3000/saveHydrogenStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hydrogenLevel: hydro.storage }),
      });
  
      if (response.ok) {
        console.log("Hydrogen level saved to DB");
      } else {
        console.error("Failed to save hydrogen level");
      }
    } catch (error) {
      console.error("Error sending hydrogen level to server:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
  fetchHydrogenLevel();
  const sellButton = document.getElementById("sell-button");
  const buyButton = document.getElementById("buy-button");
  const hydrogenButton = document.getElementById("convert-to-hydrogen");
  const electricityButton = document.getElementById("convert-to-electricity");

  if (sellButton) {
    sellButton.addEventListener("click", trade.sellElectricity.bind(trade));
  }
  if (buyButton) {
    buyButton.addEventListener("click", trade.buyElectricity.bind(trade));
  }
  if (hydrogenButton) {
    hydrogenButton.addEventListener("click", hydro.produceHydrogen.bind(hydro));
  }
  if (electricityButton) {
    electricityButton.addEventListener("click", fc.produceElectricity.bind(fc));
  }
});

// Start-Synchronisation nur einmal beim Laden
fetchBatteryLevel();


// Regelmäßige Updates laufen nur über updateSimulation()
setInterval(updateSimulation, 1000);

