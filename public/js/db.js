import { InfluxDB, Point } from "@influxdata/influxdb-client";

const token = process.env.INFLUXDB_TOKEN;
const org = "your-org";


const client = new InfluxDB({ url: "https://eu-central-1-1.aws.cloud2.influxdata.com", token });

//batteriestatus speichern in db
export async function saveBatteryStatus(batteryLevel) {
  const point = new Point("battery").floatField("level", batteryLevel);

  try {
      const writeApiBattery = client.getWriteApi(org, "Simulation");
      await writeApiBattery.writePoint(point);
      await writeApiBattery.flush();
      console.log("Battery status saved:", batteryLevel.toFixed(2), "kWh");
  } catch (error) {
      console.error("Error saving battery status:", error);
  }
}


//jetziger wholesaleprice speichern
export async function saveWholeSalePrice(timestamp, value) {
  const point = new Point("price")
      .floatField("value", value)
      .intField("timestamp", timestamp);

  try {
      const writeApiWholesale = client.getWriteApi(org, "price");
      await writeApiWholesale.writePoint(point);
      await writeApiWholesale.flush();
      console.log("Current Price saved:", timestamp, value);
  } catch (error) {
      console.error("Error saving price:", error);
  }
}

//jetzigen wholesaleprice abrufen
export async function getLastWholeSalePrice() {
  try {
    const queryApi = client.getQueryApi(org);
    const query = `from(bucket: "price")
      |> range(start: -1d)
      |> filter(fn: (r) => r._measurement == "price" and r._field == "value")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)`;  // Nur den letzten Wert abrufen

    const result = await queryApi.queryRows(query);

    // Extrahiere den Wert und den Timestamp des letzten Eintrags
    const lastPrice = result.length > 0 ? result[0]._value : null;
    const lastTimestamp = result.length > 0 ? result[0]._time : null;

    return { value: lastPrice, timestamp: lastTimestamp };
  } catch (error) {
    console.error("Error fetching last wholesale price:", error);
    throw error;
  }
}