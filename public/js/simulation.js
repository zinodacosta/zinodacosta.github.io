let timeInHours = 1 / 3600; //zeit in 5sec

class photovoltaik {
  constructor() {
    this.power = 250; //Watt
    this.efficiency = 0.2;
  }
  async checkforSun() {
    const apiKey = "e7c7b0c5b06544339dd03539253001";
    const city = "Madrid";
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
            "Die Sonne scheint. PV lädt";
          sun = true;
        } else {
          document.getElementById("sun").textContent =
            "Es ist bewölkt. PV lädt nicht";
          sun = false;
        }
      } else {
        document.getElementById("sun").textContent =
          "Es ist nachts. PV lädt nicht";
        sun = false;
      }
      return sun;
    } catch (error) {
      console.error("Fehler", error);
    }
  }
}

class battery {
  constructor() {
    this.capacity = 5; //kWh maximaler füllstand
    this.storage = 0; //kWh aktueller füllstand
  }

  updateBatteryStorage(amount) {
    if (this.storage < this.capacity) {
      this.storage += amount;
      document.getElementById("battery-level").innerHTML = "Batteriestand: " + this.storage.toFixed(2) + "kWh";
    } else {
      document.getElementById("battery-level").textContent = "Batterie ist voll";
    }
  }
}

class electrolyzer {
  constructor() {
    this.tank = 10; //kg
    this.efficiency = 0.7; //% /100
  }
}

class fuelcell {
  constructor() {
    this.efficiency = 0.5; //% /100
  }
}

class hydrogenstorage {
  constructor() {
    this.capacity = 100; //kg max storage
    this.fill_level = 20; //kg storage
  }
}

class heater {
  constructor() {
    this.efficiency = 0.9; //%
    this.tank = 50; //liter
  }
}

class powersource {
  constructor(power) {
    this.power = 2000; //W
  }
}

const pv = new photovoltaik();
const charge = new battery();

async function updateSimulation() {
  let sun = await pv.checkforSun();
  if (sun) {
    let powergenerated = pv.efficiency * pv.power * timeInHours;
    charge.updateBatteryStorage(powergenerated);
  }
}

setInterval(updateSimulation, 1000);
