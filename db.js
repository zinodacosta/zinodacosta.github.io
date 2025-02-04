import { InfluxDB, Point } from "@influxdata/influxdb-client";

const token = process.env.INFLUXDB_TOKEN;
const org = "your-org"; 
const bucket = "Simulation"; 

const client = new InfluxDB({ url: "https://eu-central-1-1.aws.cloud2.influxdata.com", token });
const writeApi = client.getWriteApi(org, bucket, "ms");

export async function saveBatteryStatus(batteryLevel) {
    const point = new Point("battery").floatField("level", batteryLevel);

    try {
        await writeApi.writePoint(point);
        await writeApi.flush(); 
        console.log("Battery status saved:", batteryLevel.toFixed(2), "kWh");
    } catch (error) {
        console.error("Error saving battery status:", error);
    }
}

export async function saveWholeSalePrice(timestamp, value,) {
    const point = new Point("wholesalePrice")
      .floatField("value", value)          //Field: value (required)
      .intField("timestamp", timestamp);   //Field: timestamp (required)
  
    try {
      console.log("Attempting to save price:", timestamp, value);
      await writeApi.writePoint(point);
      await writeApi.flush();
      console.log("Price saved:", timestamp, value);
    } catch (error) {
      console.error("Error saving price:", error);
    }
  }
