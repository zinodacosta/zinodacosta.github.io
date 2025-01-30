class photovoltaik {
  constructor(power) {
    this.power = power; //Watt
  }
  async checkforSun(){
    const apiKey = "e7c7b0c5b06544339dd03539253001";
    const city = "Tokyo";
    let sun = false;
    try{
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`)
    const data = await response.json();
        const cloudiness = data.current.cloud;
        const daytime = data.current.is_day;

      if(daytime == true){

        if(cloudiness < 20){
            console.log("Die Sonne scheint")
            sun = true;
            return sun;
        }

        else{
            console.log("Es ist bewölkt")
            sun = false;
            return sun;
        }
      }
      else{
        console.log("Es ist nachts")
        sun = false;
        return sun;
      }
    }catch(error){
      console.error("Fehler", error);
    }
  }
}

class battery {
  constructor(capacity, storage) {
    this.capacity = capacity; //kWh
    this.storage = storage; //kWh
  }
  checkBatteryStorage(storage, capacity) {
    if (storage == capacity) {
      console.log("Battery is full");
    }
  }
}

class electrolyzer {
  constructor(tank, efficiency) {
    this.tank = tank; //kg
    this.efficiency = efficiency; //Watt
  }
}

class fuelcell {
  constructor(efficiency) {
    this.efficiency = efficiency;
  }
}

class hydrogenstorage {
  constructor(capacity, fill_level) {}
}

class heater {
  constructor(efficiency, tank) {}
}

class powersource {
  constructor(power) {}
}


function main(){
  const pv = new photovoltaik;
  pv.checkforSun();

}

main();