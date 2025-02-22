import { InfluxDB, Point } from "@influxdata/influxdb-client";

const token = process.env.INFLUXDB_TOKEN;
if (!token) {
  console.error("INFLUXDB_TOKEN is not set");
  process.exit(1);
}

const org = "your-org";
const client = new InfluxDB({ url: "https://eu-central-1-1.aws.cloud2.influxdata.com", token });

// Batteriestatus speichern
export async function saveBatteryStatus(batteryLevel) {
  const point = new Point("battery").floatField("level", batteryLevel);

  try {
    const writeApiBattery = client.getWriteApi(org, "Simulation");
    writeApiBattery.writePoint(point);
    await writeApiBattery.flush();
    //console.log("Battery status saved:", batteryLevel.toFixed(2), "kWh");
  } catch (error) {
    console.error("Error saving battery status:", error);
  }
}

// Hydrogenspeicher speichern
export async function saveHydrogenStatus(hydrogenLevel) {
  const point = new Point("Hydrogen Storage").floatField("level", hydrogenLevel);

  try {
    const writeApiHydrogen = client.getWriteApi(org, "Simulation");
    writeApiHydrogen.writePoint(point);
    await writeApiHydrogen.flush();
   // console.log("Hydrogen status saved:", hydrogenLevel.toFixed(2), "g");
  } catch (error) {
    console.error("Error saving hydrogen status:", error);
  }
}

//Query battery from db
export async function getLastBatteryStatus() {
  try {
    const queryApi = client.getQueryApi(org);
    const query = `from(bucket: "Simulation")
      |> range(start: -1d)
      |> filter(fn: (r) => r._measurement == "battery" and r._field == "level")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)`;

    let lastBatteryLevel = null;
    let lastTimestamp = null;

    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const data = tableMeta.toObject(row);
          lastBatteryLevel = data._value;
          lastTimestamp = data._time;
        },
        complete() {
          resolve({ level: lastBatteryLevel, timestamp: lastTimestamp });
        },
        error(error) {
          console.error("Error fetching last battery status:", error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Error in getLastBatteryStatus:", error);
    throw error;
  }
}

//Query hydrogen lvl from db
export async function getLastHydrogenStatus() {
  try {
    const queryApi = client.getQueryApi(org);
    const query = `from(bucket: "Simulation")
      |> range(start: -1d)
      |> filter(fn: (r) => r._measurement == "Hydrogen Storage" and r._field == "level")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)`;

    let lasthydrogenLevel = null;
    let lastTimestamp = null;

    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const data = tableMeta.toObject(row);
          lasthydrogenLevel = data._value;
          lastTimestamp = data._time;
        },
        complete() {
          resolve({ level: lasthydrogenLevel, timestamp: lastTimestamp });
        },
        error(error) {
          console.error("Error fetching last hydrogen status:", error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Error in getLastHydrogenStatus:", error);
    throw error;
  }
}


// Wholesale-Preis speichern
export async function saveWholeSalePrice(timestamp, value) {
  const point = new Point("price")
    .floatField("value", value)
    .timestamp(new Date(timestamp));

  try {
    const writeApiWholesale = client.getWriteApi(org, "price");
    writeApiWholesale.writePoint(point);
    await writeApiWholesale.flush();
    console.log("Current Price saved:", timestamp, value);
  } catch (error) {
    console.error("Error saving price:", error);
  }
}

// Letzten Wholesale-Preis abrufen
export async function getLastWholeSalePrice() {
  try {
    const queryApi = client.getQueryApi(org);
    const query = `from(bucket: "price")
      |> range(start: -1d)
      |> filter(fn: (r) => r._measurement == "price" and r._field == "value")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)`;

    let lastPrice = null;
    let lastTimestamp = null;

    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const data = tableMeta.toObject(row);
          lastPrice = data._value;
          lastTimestamp = data._time;
        },
        complete() {
          resolve({ value: lastPrice, timestamp: lastTimestamp });
        },
        error(error) {
          console.error("Error fetching last wholesale price:", error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Error in getLastWholeSalePrice:", error);
    throw error;
  }
}
