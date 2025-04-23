let electrolyzerInterval = null;
let fuelCellInterval = null;
let speedfactor = 1;

const apiKey = "e7c7b0c5b06544339dd03539253001";
let city = "Frankfurt";
//js for dropdown menu of location
document.addEventListener("DOMContentLoaded", function () {
  const citySelect = document.getElementById("city-select");
  const locationDisplay = document.getElementById("location");
  if (!citySelect || !locationDisplay) return;

  locationDisplay.innerHTML = city;

  citySelect.addEventListener("change", function () {
    city = citySelect.value;
    locationDisplay.innerHTML = city;
    pv.checkforSun();
  });
});

let isNotificationVisible = false;
//fade in notification signalizing trade of electricity
function showNotification(message, type) {
  if (isNotificationVisible) return;

  isNotificationVisible = true;
  const notification = document.getElementById("notification");

  notification.textContent = message;
  notification.style.backgroundColor = type === "buy" ? "green" : "red"; //green if buy else red
  notification.style.display = "block";
  notification.style.opacity = "1";

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      notification.style.display = "none";
      isNotificationVisible = false;
    }, 500);
  }, 3000);
}

export class photovoltaik {
  constructor() {
    this.power = 250; //Watt
    this.efficiency = 20;
  }
  updatePVEfficiency(amount) {
    this.efficiency = amount;
  }
  updatePVPower(amount) {
    this.power = amount;
  }
  async checkforSun() {
    //check if api response shows local weather as sunny enough to charge pv
    document.getElementById("location").innerHTML = city;
    let sun = false;
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`
      );
      const data = await response.json();
      const cloudiness = data.current.cloud;
      const daytime = data.current.is_day;
      if (daytime) {
        if (cloudiness < 105) {
          document.getElementById("sun").textContent =
            "Sun is shining. Charge Mode";
          document.getElementById("simulation-state").innerHTML =
            " Charge Mode ";
          document.getElementById("pv-static-arrow").style.display = "none";
          document.getElementById("pv-animated-arrow").style.display = "block";
          sun = true;
        } else {
          document.getElementById("sun").textContent =
            "It is cloudy. PV not charging";
          document.getElementById("pv-animated-arrow").style.display = "none";
          document.getElementById("pv-static-arrow").style.display = "block";
          sun = false;
        }
      } else {
        document.getElementById("sun").textContent =
          "It is night-time. PV not charging";
        document.getElementById("pv-animated-arrow").style.display = "none";
        document.getElementById("pv-static-arrow").style.display = "block";
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
    this.capacity = 100; //kWh max val
    this.storage = 0; //kWh current val
    this.efficiency = 100;
  }

  updateBatteryEfficiency(amount) {
    this.efficiency = amount;
  }

  updateBatteryCapacity(amount) {
    this.capacity = amount;
  }

  updateBatteryStorage(amount) {
    if (amount > 0 && this.storage < this.capacity) {
      this.storage += amount;
    } else if (amount < 0 && this.storage > 0) {
      this.storage += amount;
    }

    //Update the battery level and gauge
    document.getElementById("battery-level").innerHTML =
      this.storage.toFixed(2) + " kWh";
    let batteryPercentage = (this.storage / this.capacity) * 100;
    document.getElementById("battery-gauge-percentage").innerHTML =
      batteryPercentage.toFixed(1) + " %";
    document.getElementById("battery-gauge-level").style.width =
      batteryPercentage.toFixed(1) + "%";
  }
}

export class fuelcell {
  constructor() {
    this.efficiency = 0.9; //%
    this.power = 500; //W
    this.fuelcellflag = false;
  }

  updateFuelCellEfficiency(amount) {
    this.efficiency = amount;
  }

  updateFuelCellPower(amount) {
    this.power = amount;
  }

  produceElectricity() {
    if (hydro.storage > 0) {
      let powerProduced =
        (hydro.storage *
          33.3 *
          (this.efficiency / 100) *
          (this.power / 1000) *
          speedfactor) /
        100;
      //Wasserstoffspeicher * 33.3kwH/kg * Brennstoffzelle Wirkungsgrad * Brennstoffzelle Leistung
      charge.updateBatteryStorage(powerProduced);
      hydro.storage -= powerProduced;

      document.getElementById("battery-level").innerHTML =
        charge.storage.toFixed(2) + " kWh";
      let batteryPercentage = (this.storage / this.capacity) * 100;
      document.getElementById("battery-gauge-percentage").innerHTML =
        batteryPercentage.toFixed(1) + " %";
      document.getElementById("battery-gauge-level").style.width =
        batteryPercentage.toFixed(1) + "%";
      document.getElementById("hydrogen-level").innerHTML =
        hydro.storage.toFixed(2) + " g";
    } else {
    }
  }
}
export class electrolyzer {
  constructor() {
    this.efficiency = 70; //%
    this.power = 200; //W
    this.storage = 0;
    this.capacity = 100; //g
    this.hydrogenflag = false;
  }

  updateElectrolyzerEfficiency(amount) {
    this.efficiency = amount;
  }

  updateElectrolyzerCapacity(amount) {
    this.capacity = amount;
  }

  updateElectrolyzerPower(amount) {
    this.power = amount;
  }

  produceHydrogen() {
    if (charge.storage > 0.1) {
      let hydrogenProduced =
        (charge.storage *
          55.5 *
          (this.efficiency / 100) *
          (this.power / 1000) *
          speedfactor) /
        10000;
      //Batterie Speicher * 55.5kWh * Elektrolyzeur Wirkungsgrad * Elektrolyzeur Leistung
      if (this.storage + hydrogenProduced <= this.capacity) {
        this.storage += hydrogenProduced;
        let batteryConsumption =
          hydrogenProduced * (1 / (this.efficiency / 100));
        charge.updateBatteryStorage(-batteryConsumption); //Adjust battery consumption based on efficiency
        document.getElementById("hydrogen-level").innerHTML =
          this.storage.toFixed(2) + " g";
        let hydrogenPercentage = (this.storage / this.capacity) * 100;
        if (
          document.getElementById("simulation-state").innerHTML ===
          "Charge Mode"
        ) {
          document.getElementById("simulation-state").innerHTML =
            "Charge Mode + Hydrogen Mode ";
        } else {
          document.getElementById("simulation-state").innerHTML =
            "Hydrogen Mode ";
        }
        document.getElementById("hydrogen-gauge-percentage").innerHTML =
          hydrogenPercentage.toFixed(1) + " %";
        document.getElementById("hydrogen-gauge-level").style.width =
          hydrogenPercentage + "%";
      } else {
        document.getElementById("hydrogen-level").innerHTML =
          "Hydrogen Storage is full";
      }
    } else {
      document.getElementById("hydrogen-level").innerHTML =
        this.storage.toFixed(2) + " g";
      let hydrogenPercentage = (this.storage / this.capacity) * 100;
      document.getElementById("hydrogen-gauge-percentage").innerHTML =
        hydrogenPercentage.toFixed(1) + " %";
      document.getElementById("hydrogen-gauge-level").style.width =
        hydrogenPercentage + "%";
    }
  }
}

export class heater {
  constructor() {
    this.efficiency = 55;
    this.power = 200;
    this.temperature = 18;
    this.ambientTemperature = 18;
  }

  produceHeat() {
    if (hydro.storage > 0.1) {
      let heatProduced =
        (((this.power * (1 / (this.efficiency / 100) - 1)) / 1005) *
          50 *
          speedfactor) /
        10000; //Q = Pel*(1/Wirkungsgrad - 1) / Wärmekapazität Luft * Volumen Luft
    }
  }
}
const pv = new photovoltaik();
const charge = new battery();
const hydro = new electrolyzer();
const fc = new fuelcell();

async function fetchHydrogenLevel() {
  //database fetch might get discontinued 
  try {
    const response = await fetch("http://localhost:3000/getHydrogenStatus");
    const data = await response.json();

    if (data.level !== undefined && data.level !== null) {
      hydro.storage = data.level;
      document.getElementById(
        "hydrogen-level"
      ).innerText = ` ${hydro.storage.toFixed(2)} g`;
    } else {
      document.getElementById("hydrogen-level").innerText =
        "No hydrogen data available";
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("hydrogen-level").innerText =
      "Error fetching hydrogen data";
  }
}

export class powersource {
  constructor() {
    this.totalpower = 1000; //W
  }
  async totalWattConsumption() {
    let powerconsumption = this.totalpower - hydro.power;
    document.getElementById("power-consumption").innerHTML =
      powerconsumption.toFixed(2) + "W";
  }
}
//TODO if no last price entry exists in API -> use latest usable one
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

//API fetch for carbon intensity
async function getCarbonIntensity() {
  try {
    const response = await fetch("http://localhost:3000/get-carbon-intensity");
    const data = await response.json();
    console.log("intensity", data);
    document.getElementById("carbon-intensity").innerHTML = data + " gCO₂/kWh";
  } catch (error) {
    console.error("Error fetching Carbon Intensity", error);
    return null;
  }
}

//db fetch for battery levle
async function fetchBatteryLevel() {
  try {
    const response = await fetch("http://localhost:3000/getBatteryStatus");
    const data = await response.json();

    if (data.level !== undefined) {
      charge.storage = data.level; //Batterie-Speicher synchronisieren
      document.getElementById(
        "battery-level"
      ).innerText = ` ${data.level.toFixed(2)} kWh`;
      let batteryPercentage = (charge.storage / charge.capacity) * 100;
      document.getElementById("battery-gauge-percentage").innerHTML =
        batteryPercentage.toFixed(1) + " %";
      document.getElementById("battery-gauge-level").style.width =
        batteryPercentage + "%";
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

    //Check if elements exist before trying to modify them
    const currentPriceElement = document.getElementById("current-price");
    if (currentPriceElement) {
      currentPriceElement.innerHTML = this.electricityPrice + "€/MWh";
    }
    document.getElementById("current-price").innerHTML = this.electricityPrice;
    const buyingPriceElement = document.getElementById("buying-price");
    if (buyingPriceElement) {
      if (this.electricityPrice > 100) {
        buyingPriceElement.innerHTML =
          "Current Price is over threshold -> sell electricity";
        if (charge.storage != 0) {
          charge.storage -= 1;
          this.money += this.electricityPrice;
          document.getElementById("money").innerHTML =
            " : " + this.money + " €";
        }
      } else if (this.electricityPrice < 80) {
        buyingPriceElement.innerHTML =
          "Current Price is under threshold -> buy electricity";
        charge.storage += 1;
        this.money -= this.electricityPrice;
        document.getElementById("money").innerHTML = " : " + this.money + " €";
      }
    }
  }

  async buyElectricity() {
    if (this.money < 0) {
      if (this.electricityPrice === null || isNaN(this.electricityPrice)) { //waiting for api to fetch price
        await this.priceCheck();
        if (this.electricityPrice === null || isNaN(this.electricityPrice))
          return;
      }  
        if (charge.storage + 1 <= charge.capacity) {
          console.log("Bought 1kWh");
          showNotification("1kW Electricity bought!", "buy");
          this.money -= this.electricityPrice * 0.1;
          charge.updateBatteryStorage(1);
          document.getElementById("money").innerHTML =
            " : " + this.money.toFixed(2) + " €";
        } else {
          document.getElementById("battery-level").innerHTML =
            "Can't buy, battery is full";
        }
    }
  }
  async sellElectricity() {
    if (charge.storage >= 1) {
      if (this.electricityPrice === null || isNaN(this.electricityPrice)) {
        await this.priceCheck();
        if (this.electricityPrice === null || isNaN(this.electricityPrice))
          return;
      }
      console.log("Sold 1kWh");
      showNotification("1kW Electricity sold!", "sell");
      this.money += this.electricityPrice * 0.1;
      charge.updateBatteryStorage(-1);
      document.getElementById("money").innerHTML =
        " : " + this.money.toFixed(2) + " €";
    }
  }
}
let trade = new tradeElectricity();

async function updateSimulation() {
  //Check for sun and charge battery if possible
  let sun = await pv.checkforSun();
  if (sun && charge.storage < charge.capacity) {
    let powergenerated =
      ((pv.efficiency / 100) *
        pv.power *
        (charge.efficiency / 100) *
        speedfactor) /
      1000;
    if (powergenerated + charge.storage <= charge.capacity) {
      charge.updateBatteryStorage(powergenerated);
    }
  }

  /**
  //Send battery level to server
  try {
    const response = await fetch("http://localhost:3000/saveBatteryStatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ batteryLevel: charge.storage }),
    });

    if (response.ok) {
    } else {
      console.error("Failed to save battery level");
    }
  } catch (error) {
    console.error("Error sending battery level to server:", error);
  }
  //Send hydrogen level to server

   try {
    const response = await fetch("http://localhost:3000/saveHydrogenStatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hydrogenLevel: hydro.storage }),
    });

    if (response.ok) {
    } else {
      console.error("Failed to save hydrogen level");
    }
  } catch (error) {
    console.error("Error sending hydrogen level to server:", error);
  }
   */


  //Automate trade logic
  if (trade.electricityPrice > 150) {
    console.log("Electricity Price over Threshold: Selling Electricity");
    await fc.produceElectricity();
    await trade.sellElectricity();
  }
  if (trade.electricityPrice < 80) {
    console.log("Electricity Price under Threshold: Buying Electricity");
    await trade.buyElectricity();

    if (trade.electricityPrice > 80 && trade.electricityPrice < 150) {
      console.log("Electricity Price in acceptable range");
      await hydro.produceHydrogen();
    }
  }
  if (charge.storage / charge.capacity > 0.8 && trade.electricityPrice < 150) {
    await hydro.produceHydrogen();
  }

  const waveLoader1before = document.querySelector(".wave-loader1");
  waveLoader1before.style.setProperty(
    "--before-top",
    (charge.storage / charge.capacity) * 100 * -1 - 15 + "%"
  );
  const waveLoader1after = document.querySelector(".wave-loader1");
  waveLoader1after.style.setProperty(
    "--after-top",
    (charge.storage / charge.capacity) * 100 * -1 - 15 + "%"
  );
  const waveLoader2before = document.querySelector(".wave-loader2");
  waveLoader2before.style.setProperty(
    "--before-top",
    (hydro.storage / hydro.capacity) * 100 * -1 - 15 + "%"
  );
  const waveLoader2after = document.querySelector(".wave-loader2");
  waveLoader2after.style.setProperty(
    "--after-top",
    (hydro.storage / hydro.capacity) * 100 * -1 - 15 + "%"
  );
}

function resetSimulation() {
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
  document.getElementById("battery-gauge-percentage").innerText = " 0 %";
  document.getElementById("battery-gauge-level").style.width = 0;

  document.getElementById("hydrogen-level").innerText = " 0 g";

  document.getElementById("hydrogen-gauge-percentage").innerText = " 0 %";
  document.getElementById("hydrogen-gauge-level").style.width = 0;
  document.getElementById("money").innerText = " : 0 €";
}

//Slider für Simulation
document.addEventListener("DOMContentLoaded", function () {
  const sellButton = document.getElementById("sell-button");
  const buyButton = document.getElementById("buy-button");
  const resetButton = document.getElementById("reset");

  const batteryEfficiencySlider = document.getElementById("battery-efficiency");
  const batteryEfficiencyValueDisplay = document.getElementById(
    "battery-efficiency-value"
  );

  const batteryCapacitySlider = document.getElementById("battery-capacity");
  const batteryCapacityValueDisplay = document.getElementById(
    "battery-capacity-value"
  );

  const electrolyzerEfficiencySlider = document.getElementById(
    "electrolyzer-efficiency"
  );
  const electrolyzerEfficiencyValueDisplay = document.getElementById(
    "electrolyzer-efficiency-value"
  );

  const electrolyzerPowerSlider = document.getElementById("electrolyzer-power");
  const electrolyzerPowerValueDisplay = document.getElementById(
    "electrolyzer-power-value"
  );

  const electrolyzerCapacitySlider = document.getElementById(
    "electrolyzer-capacity"
  );
  const electrolyzerCapacityValueDisplay = document.getElementById(
    "electrolyzer-capacity-value"
  );

  const fuelcellPowerSlider = document.getElementById("fuelcell-power");
  const fuelcellPowerValueDisplay = document.getElementById(
    "fuelcell-power-value"
  );

  const fuelcellEfficiencySlider = document.getElementById(
    "fuelcell-efficiency"
  );
  const fuelcellEfficiencyValueDisplay = document.getElementById(
    "fuelcell-efficiency-value"
  );

  const PVEfficiencySlider = document.getElementById("PV-efficiency");
  const PVEfficiencyValueDisplay = document.getElementById(
    "PV-efficiency-value"
  );

  const PVPowerSlider = document.getElementById("PV-power");
  const PVPowerValueDisplay = document.getElementById("PV-power-value");

  const speedfactorSlider = document.getElementById("speed-factor");
  const speedfactorDisplay = document.getElementById("speed-factor-value");

  speedfactorSlider.addEventListener("input", function () {
    const input = parseFloat(speedfactorSlider.value);
    speedfactorDisplay.textContent = input + "x";
    speedfactor = input;
    console.log(input);
  });

  batteryEfficiencySlider.addEventListener("input", function () {
    const efficiency = parseFloat(batteryEfficiencySlider.value);
    batteryEfficiencyValueDisplay.textContent = efficiency + "%";
    charge.updateBatteryEfficiency(efficiency);
  });

  batteryCapacitySlider.addEventListener("input", function () {
    const capacity = parseFloat(batteryCapacitySlider.value);
    batteryCapacityValueDisplay.textContent = capacity + "kWh";
    charge.updateBatteryCapacity(capacity);
  });

  electrolyzerEfficiencySlider.addEventListener("input", function () {
    const efficiency = parseFloat(electrolyzerEfficiencySlider.value);
    electrolyzerEfficiencyValueDisplay.textContent = efficiency + "%";
    hydro.updateElectrolyzerEfficiency(efficiency);
  });

  electrolyzerPowerSlider.addEventListener("input", function () {
    const power = parseFloat(electrolyzerPowerSlider.value);
    electrolyzerPowerValueDisplay.textContent = power + " Watt";
    hydro.updateElectrolyzerPower(power);
  });

  electrolyzerCapacitySlider.addEventListener("input", function () {
    const capacity = parseFloat(electrolyzerCapacitySlider.value);
    electrolyzerCapacityValueDisplay.textContent = capacity + " g";
    hydro.updateElectrolyzerCapacity(capacity);
  });

  fuelcellPowerSlider.addEventListener("input", function () {
    const power = parseFloat(fuelcellPowerSlider.value);
    fuelcellPowerValueDisplay.textContent = power + " Watt";
    fc.updateFuelCellPower(power);
  });

  fuelcellEfficiencySlider.addEventListener("input", function () {
    const efficiency = parseFloat(fuelcellEfficiencySlider.value);
    fuelcellEfficiencyValueDisplay.textContent = efficiency + "%";
    fc.updateFuelCellEfficiency(efficiency);
  });

  PVEfficiencySlider.addEventListener("input", function () {
    const efficiency = parseFloat(PVEfficiencySlider.value);
    PVEfficiencyValueDisplay.textContent = efficiency + "%";
    pv.updatePVEfficiency(efficiency);
  });

  PVPowerSlider.addEventListener("input", function () {
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

  const usecase = document.getElementById("use-case");

  usecase.addEventListener("change", function () {
    // Update values when selection changes
    const bulletPointsContainer = document.getElementById(
      "bullet-points-container"
    );
    bulletPointsContainer.innerHTML = "";

    let bulletPoints = [];

    if (usecase.value === "offgrid") {
      bulletPoints = [
        "A house powered by solar panels, with a battery for short-term storage and a hydrogen system for long-term energy storage.",

        "During the day, excess solar power is used to generate hydrogen via electrolysis.",

        "At night or on cloudy days, the fuel cell converts hydrogen back into electricity.",

        "The system sells excess electricity to the grid when prices are high and buys when prices are low.",
      ];
      resetSimulation();
      pv.updatePVPower(10000);
      PVPowerValueDisplay.textContent = 10 + "kW";
      PVPowerSlider.value = 10000;
      pv.updatePVEfficiency(22);
      PVEfficiencyValueDisplay.textContent = 22 + "%";
      PVEfficiencySlider.value = 22;

      charge.updateBatteryEfficiency(95);
      batteryEfficiencyValueDisplay.textContent = 95 + "%";
      batteryEfficiencySlider.value = 95;
      charge.updateBatteryCapacity(20);
      batteryCapacityValueDisplay.textContent = 20 + "kWh";
      batteryCapacitySlider.value = 20;

      hydro.updateElectrolyzerPower(5000);
      electrolyzerPowerValueDisplay.textContent = 5000 + "W";
      electrolyzerPowerSlider.value = 5000;
      hydro.updateElectrolyzerEfficiency(70);
      electrolyzerEfficiencyValueDisplay.textContent = 70 + "%";
      electrolyzerEfficiencySlider.value = 70;
      hydro.updateElectrolyzerCapacity(300);
      electrolyzerCapacityValueDisplay.textContent = 300 + "g";
      electrolyzerCapacitySlider.value = 300;

      fc.updateFuelCellPower(3000);
      fuelcellPowerSlider.value = 3000;
      fuelcellPowerValueDisplay.textContent = 3000 + "W";
      fc.updateFuelCellEfficiency(60);
      fuelcellEfficiencyValueDisplay.textContent = 60 + "%";
      fuelcellEfficiencySlider.value = 60;
    }

    if (usecase.value === "microgrid") {
      bulletPoints = [
        "A small community with unreliable grid access uses solar panels, batteries, and hydrogen storage for 24/7 power.",

        "The system optimizes energy flow, prioritizing battery storage for short-term demand and hydrogen for seasonal storage.",

        "Villagers share a common energy trading system, where surplus power is bought and sold dynamically.",
      ];
      resetSimulation();
      pv.updatePVPower(200000);
      PVPowerValueDisplay.textContent = 200 + "kW";
      PVPowerSlider.value = 200000;
      pv.updatePVEfficiency(22);
      PVEfficiencyValueDisplay.textContent = 22 + "%";
      PVEfficiencySlider.value = 22;

      charge.updateBatteryEfficiency(95);
      batteryEfficiencyValueDisplay.textContent = 95 + "%";
      batteryEfficiencySlider.value = 95;
      charge.updateBatteryCapacity(500);
      batteryCapacityValueDisplay.textContent = 500 + "kWh";
      batteryCapacitySlider.value = 500;

      hydro.updateElectrolyzerPower(100000);
      electrolyzerPowerValueDisplay.textContent = 100 + "kW";
      electrolyzerPowerSlider.value = 100000;
      hydro.updateElectrolyzerEfficiency(70);
      electrolyzerEfficiencyValueDisplay.textContent = 70 + "%";
      electrolyzerEfficiencySlider.value = 70;
      hydro.updateElectrolyzerCapacity(3000);
      electrolyzerCapacityValueDisplay.textContent = 3000 + "g";
      electrolyzerCapacitySlider.value = 3000;

      fc.updateFuelCellPower(80000);
      fuelcellPowerSlider.value = 80000;
      fuelcellPowerValueDisplay.textContent = 80 + "kW";
      fc.updateFuelCellEfficiency(60);
      fuelcellEfficiencyValueDisplay.textContent = 60 + "%";
      fuelcellEfficiencySlider.value = 60;
    }

    if (usecase.value === "evcharge") {
      bulletPoints = [
        "A charging station for electric vehicles powered by solar energy, with a battery for quick power delivery and hydrogen for backup.",

        "When there’s surplus solar power, it’s used to generate hydrogen instead of wasting energy.",

        "The station dynamically adjusts pricing based on energy availability and grid prices.",
      ];
      resetSimulation();
      pv.updatePVPower(500000);
      PVPowerValueDisplay.textContent = 500 + "kW";
      PVPowerSlider.value = 500000;
      pv.updatePVEfficiency(22);
      PVEfficiencyValueDisplay.textContent = 22 + "%";
      PVEfficiencySlider.value = 22;

      charge.updateBatteryEfficiency(95);
      batteryEfficiencyValueDisplay.textContent = 95 + "%";
      batteryEfficiencySlider.value = 95;
      charge.updateBatteryCapacity(1000);
      batteryCapacityValueDisplay.textContent = 1000 + "kWh";
      batteryCapacitySlider.value = 1000;

      hydro.updateElectrolyzerPower(200000);
      electrolyzerPowerValueDisplay.textContent = 200 + "kW";
      electrolyzerPowerSlider.value = 200000;
      hydro.updateElectrolyzerEfficiency(70);
      electrolyzerEfficiencyValueDisplay.textContent = 70 + "%";
      electrolyzerEfficiencySlider.value = 70;
      hydro.updateElectrolyzerCapacity(12000);
      electrolyzerCapacityValueDisplay.textContent = 12000 + "g";
      electrolyzerCapacitySlider.value = 12000;

      fc.updateFuelCellPower(200000);
      fuelcellPowerSlider.value = 200000;
      fuelcellPowerValueDisplay.textContent = 200 + "kW";
      fc.updateFuelCellEfficiency(60);
      fuelcellEfficiencyValueDisplay.textContent = 60 + "%";
      fuelcellEfficiencySlider.value = 60;
    }

    if (usecase.value === "industrial") {
      bulletPoints = [
        "A factory with high energy demand uses solar power to generate hydrogen, which is stored for later use in production or fuel cells.",

        "When electricity prices are low, the factory buys from the grid; when high, it switches to stored hydrogen.",

        "The plant sells excess hydrogen or electricity back to the grid for profit.",
      ];
      resetSimulation();
      pv.updatePVPower(1000000);
      PVPowerValueDisplay.textContent = 1 + "MW";
      PVPowerSlider.value = 1000000;
      pv.updatePVEfficiency(22);
      PVEfficiencyValueDisplay.textContent = 22 + "%";
      PVEfficiencySlider.value = 22;

      charge.updateBatteryEfficiency(95);
      batteryEfficiencyValueDisplay.textContent = 95 + "%";
      batteryEfficiencySlider.value = 95;
      charge.updateBatteryCapacity(10000000);
      batteryCapacityValueDisplay.textContent = 10 + "MWh";
      batteryCapacitySlider.value = 1000000;

      hydro.updateElectrolyzerPower(1000000);
      electrolyzerPowerValueDisplay.textContent = 1 + "MW";
      electrolyzerPowerSlider.value = 1000000;
      hydro.updateElectrolyzerEfficiency(70);
      electrolyzerEfficiencyValueDisplay.textContent = 70 + "%";
      electrolyzerEfficiencySlider.value = 70;
      hydro.updateElectrolyzerCapacity(500000);
      electrolyzerCapacityValueDisplay.textContent = 500 + "kg";
      electrolyzerCapacitySlider.value = 500000;

      fc.updateFuelCellPower(1000000);
      fuelcellPowerSlider.value = 1000000;
      fuelcellPowerValueDisplay.textContent = 1 + "MW";
      fc.updateFuelCellEfficiency(60);
      fuelcellEfficiencyValueDisplay.textContent = 60 + "%";
      fuelcellEfficiencySlider.value = 60;
    }

    const ul = document.createElement("ul");

    bulletPoints.forEach((point) => {
      const li = document.createElement("li");
      li.textContent = point;
      ul.appendChild(li);
    });

    // Append the bullet points to the container
    bulletPointsContainer.appendChild(ul);
  });

  // Trigger change event on page load to set initial values
  usecase.dispatchEvent(new Event("change"));
});

//Buttons für die Simulation
document.getElementById("convert-to-hydrogen").addEventListener("click", () => {
  if(hydro.storage > 0){
    document.getElementById("simulation-state").innerHTML = " Hydrogen Mode ";
    document.getElementById("electrolyzer-static-arrow").style.display = "none";
    document.getElementById("electrolyzer-animated-arrow").style.display =
      "block";
    //Starte die Umwandlung im Elektrolyseur, wenn noch kein Intervall läuft
    if (electrolyzerInterval === null) {
      electrolyzerInterval = setInterval(() => {
        hydro.produceHydrogen(); //Wasserstoffproduktion schrittweise
      }, 1000); //Alle Sekunde
      console.log("Electrolyzer started");
    }
  }
});

document
  .getElementById("convert-to-electricity")
  .addEventListener("click", () => {
    if(hydro.storage > 0){

      document.getElementById("simulation-state").innerHTML = " Fuel Cell Mode ";
      document.getElementById("fuelcell-static-arrow").style.display = "none";
      document.getElementById("fuelcell-animated-arrow").style.display = "block";
      //Starte die Umwandlung im Elektrolyseur, wenn noch kein Intervall läuft
      if (fuelCellInterval === null) {
        fuelCellInterval = setInterval(() => {
          fc.produceElectricity(); //Wasserstoffproduktion schrittweise
        }, 1000); //Alle Sekunde
        console.log("Fuelcell started");
      }
    }

  });

document
  .getElementById("convert-to-hydrogen-stop")
  .addEventListener("click", () => {
    
    document.getElementById("simulation-state").innerHTML = " ";
    document.getElementById("electrolyzer-static-arrow").style.display =
      "block";
    document.getElementById("electrolyzer-animated-arrow").style.display =
      "none";
    if (electrolyzerInterval !== null) {
      clearInterval(electrolyzerInterval); //Stoppe den Elektrolyseur
      electrolyzerInterval = null;
      console.log("Electrolyzer stopped");
    }
  });

document
  .getElementById("convert-to-electricity-stop")
  .addEventListener("click", () => {
    document.getElementById("simulation-state").innerHTML = " ";
    document.getElementById("fuelcell-static-arrow").style.display = "block";
    document.getElementById("fuelcell-animated-arrow").style.display = "none";
    if (fuelCellInterval !== null) {
      clearInterval(fuelCellInterval); //Stoppe die Brennstoffzelle
      fuelCellInterval = null;
      console.log("Fuel Cell stopped");
    }
  });

const priceContainer = document.getElementById("price-container");
const co2Container = document.getElementById("co2-container");

let isPriceVisible = true;

function togglePrices() {
  if (isPriceVisible) {
    // Slide price container out to the left and CO2 container in from the right
    priceContainer.style.transform = "translateX(-100%)"; // Price moves out of bounds
    co2Container.style.transform = "translateX(0)"; // CO2 comes into view
  } else {
    // Slide CO2 container out to the left and price container back in from the right
    co2Container.style.transform = "translateX(100%)"; // CO2 moves out of bounds
    priceContainer.style.transform = "translateX(0)"; // Price comes back in
  }

  // Toggle visibility for the next cycle
  isPriceVisible = !isPriceVisible;
}

// Set interval to swap containers every 5 seconds
setInterval(togglePrices, 10000); // 5000ms = 5 seconds

//Start-Synchronisation nur einmal beim Laden
getCarbonIntensity();

//Regelmäßige Updates laufen nur über updateSimulation()
setInterval(updateSimulation, 1000);

//TODO- farbschema an website anpassen
