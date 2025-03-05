let electrolyzerInterval = null;
let fuelCellInterval = null;
let speedfactor = 1;

export class photovoltaik {
  constructor() {
    this.power = 250; //Watt
    this.efficiency = 20;
  }

  updatePVPower(amount){
    this.power = amount;
  }

  updatePVEfficiency(amount){
    this.efficiency = amount;
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
            "Sun is shining. Charge Mode";
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
    this.capacity = 10000; //kWh maximaler Füllstand
    this.storage = 0; //kWh aktueller Füllstand
    this.efficiency = 100;
  }

  updateBatteryEfficiency(amount){
    this.efficiency = amount;
  }

  updateBatteryCapacity(amount){
    this.capacity = amount;
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

  updateFuelCellEfficiency(amount){
    this.efficiency = amount;
  }

  updateFuelCellPower(amount){
    this.power = amount;
  }
  produceElectricity() {
    if (hydro.storage > 0) {
      let powerProduced = (hydro.storage * 33.3 * (this.efficiency/100) * (this.power/1000)  * speedfactor) / 10000; 
      //Wasserstoffspeicher * 33.3kwH/kg * Brennstoffzelle Wirkungsgrad * Brennstoffzelle Leistung
      charge.updateBatteryStorage(powerProduced);
      hydro.storage -= powerProduced; // Wasserstoff wird verbraucht

      document.getElementById("battery-level").innerHTML =
        charge.storage.toFixed(2) + "kWh";
        document.getElementById("hydrogen-level").innerHTML = hydro.storage.toFixed(2) + " g";
    }
  }
}
export class electrolyzer {
  constructor() {
    this.efficiency = 70; //%
    this.power = 200; //W
    this.storage = 0;
    this.capacity = 50000;
  }

  updateElectrolyzerEfficiency(amount){
    this.efficiency = amount;
  }

  updateElectrolyzerPower(amount){
    this.power = amount
  }

  produceHydrogen() {
    if (charge.storage > 0.1) {
      let hydrogenProduced = (((charge.storage * 55.5) * (this.efficiency/100) * (this.power/1000) * speedfactor) / 10000);
      //Battery Speicher * 55.5kWh * Elektrolyzeur Wirkungsgrad * Elektrolyzeur Leistung
      if (this.storage + hydrogenProduced <= this.capacity) {
        this.storage += hydrogenProduced;
        let batteryConsumption = hydrogenProduced / this.efficiency;
        charge.updateBatteryStorage(-batteryConsumption); // Adjust battery consumption based on efficiency
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
      document.getElementById("hydrogen-level").innerText = ` ${hydro.storage.toFixed(2)} g`;
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
      ).innerText = ` ${data.level.toFixed(2)} kWh`;
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
    let powergenerated = (pv.efficiency/100) * pv.power * (charge.efficiency/100) * speedfactor / 1000;
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


function resetSimulation(){
  console.log("Reset");
  charge.storage = 0;
  hydro.storage = 0;
  trade.money = 0;

  if (electrolyzerInterval !== null) {
    clearInterval(electrolyzerInterval);
    electrolyzerInterval = null;
  }

  if (fuelCellInterval !== null) {
    clearInterval(fuelCellInterval);
    fuelCellInterval = null;
  }

document.getElementById("battery-level").innerText = " 0 kWh";
document.getElementById("hydrogen-level").innerText = " 0 g";
document.getElementById("money").innerText = " : 0 €";
}


document.addEventListener("DOMContentLoaded", function () {
  fetchHydrogenLevel();
  const sellButton = document.getElementById("sell-button");
  const buyButton = document.getElementById("buy-button");
  const resetButton = document.getElementById("reset");

  const batteryEfficiencySlider = document.getElementById("battery-efficiency");
  const batteryEfficiencyValueDisplay = document.getElementById("battery-efficiency-value");

  const batteryCapacitySlider = document.getElementById("battery-capacity");
  const batteryCapacityValueDisplay = document.getElementById("battery-capacity-value");

  const electrolyzerEfficiencySlider = document.getElementById("electrolyzer-efficiency");
  const electrolyzerEfficiencyValueDisplay = document.getElementById("electrolyzer-efficiency-value");

  const electrolyzerPowerSlider = document.getElementById("electrolyzer-power");
  const electrolyzerPowerValueDisplay = document.getElementById("electrolyzer-power-value");

  const fuelcellPowerSlider = document.getElementById("fuelcell-power");
  const fuelcellPowerValueDisplay = document.getElementById("fuelcell-power-value");

  const fuelcellEfficiencySlider = document.getElementById("fuelcell-efficiency");
  const fuelcellEfficiencyValueDisplay = document.getElementById("fuelcell-efficiency-value");

  const PVEfficiencySlider = document.getElementById("PV-efficiency");
  const PVEfficiencyValueDisplay = document.getElementById("PV-efficiency-value");

  const PVPowerSlider = document.getElementById("PV-power");
  const PVPowerValueDisplay = document.getElementById("PV-power-value");
  
  const speedfactorSlider = document.getElementById("speed-factor");
  const speedfactorDisplay = document.getElementById("speed-factor-value");
  

  speedfactorSlider.addEventListener("input", function(){
    const input = parseFloat(speedfactorSlider.value);
    speedfactorDisplay.textContent = input + "x";
    speedfactor = input;
    console.log(input);
  });

  batteryEfficiencySlider.addEventListener("input", function(){
    const efficiency = parseFloat(batteryEfficiencySlider.value);
    batteryEfficiencyValueDisplay.textContent = efficiency + "%";
    charge.updateBatteryEfficiency(efficiency);
  });

  batteryCapacitySlider.addEventListener("input", function(){
    const capacity = parseFloat(batteryCapacitySlider.value);
    batteryCapacityValueDisplay.textContent = capacity + "kWh";
    charge.updateBatteryCapacity(capacity);
  });

  electrolyzerEfficiencySlider.addEventListener("input", function(){
    const efficiency = parseFloat(electrolyzerEfficiencySlider.value);
    electrolyzerEfficiencyValueDisplay.textContent = efficiency + "%";
    hydro.updateElectrolyzerEfficiency(efficiency);
  });

  electrolyzerPowerSlider.addEventListener("input", function(){
    const power = parseFloat(electrolyzerPowerSlider.value);
    electrolyzerPowerValueDisplay.textContent = power + " Watt";
    hydro.updateElectrolyzerPower(power);
  });

  fuelcellPowerSlider.addEventListener("input", function(){
    const power = parseFloat(fuelcellPowerSlider.value);
    fuelcellPowerValueDisplay.textContent = power + " Watt";
    fc.updateFuelCellPower(power);
  });

  fuelcellEfficiencySlider.addEventListener("input", function(){
    const efficiency = parseFloat(fuelcellEfficiencySlider.value);
    fuelcellEfficiencyValueDisplay.textContent = efficiency + "%";
    fc.updateFuelCellEfficiency(efficiency);
  });

  PVEfficiencySlider.addEventListener("input", function(){
    const efficiency = parseFloat(PVEfficiencySlider.value);
    PVEfficiencyValueDisplay.textContent = efficiency + "%";
    pv.updatePVEfficiency(efficiency);
  });

  PVPowerSlider.addEventListener("input", function(){
    const power = parseFloat(PVPowerSlider.value);
    PVPowerValueDisplay.textContent = power + " Watt";
    pv.updatePVPower(power);
  });

  if (sellButton) {
    sellButton.addEventListener("click", trade.sellElectricity.bind(trade));
  }
  if (resetButton) {
    resetButton.addEventListener("click", resetSimulation);
  }

  if (buyButton) {
    buyButton.addEventListener("click", trade.buyElectricity.bind(trade));
  }
});


document.getElementById("convert-to-hydrogen").addEventListener("click", () => {
  // Starte die Umwandlung im Elektrolyseur, wenn noch kein Intervall läuft
  if (electrolyzerInterval === null) {
    electrolyzerInterval = setInterval(() => {
      hydro.produceHydrogen();  // Wasserstoffproduktion schrittweise
    }, 1000);  // Alle Sekunde
    console.log("Electrolyzer started");
  }
});

document.getElementById("convert-to-electricity").addEventListener("click", () => {
  // Starte die Umwandlung im Elektrolyseur, wenn noch kein Intervall läuft
  if (fuelCellInterval === null) {
    fuelCellInterval = setInterval(() => {
      fc.produceElectricity();  // Wasserstoffproduktion schrittweise
    }, 1000);  // Alle Sekunde
    console.log("Fuelcell started");
  }
});

document.getElementById("convert-to-hydrogen-stop").addEventListener("click", () => {
  if (electrolyzerInterval !== null) {
    clearInterval(electrolyzerInterval); // Stoppe den Elektrolyseur
    electrolyzerInterval = null;
    console.log("Electrolyzer stopped");
  }
});

document.getElementById("convert-to-electricity-stop").addEventListener("click", () => {
  if (fuelCellInterval !== null) {
    clearInterval(fuelCellInterval); // Stoppe die Brennstoffzelle
    fuelCellInterval = null;
    console.log("Fuel Cell stopped");
  }
});


// Start-Synchronisation nur einmal beim Laden
fetchBatteryLevel();


// Regelmäßige Updates laufen nur über updateSimulation()
setInterval(updateSimulation, 1000);
