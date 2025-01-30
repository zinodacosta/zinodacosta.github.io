import { InfluxDB, Point } from '@influxdata/influxdb-client';

const token = process.env.INFLUXDB_TOKEN;
const org = 'your-org'; // Deine Organisation in InfluxDB
const bucket = 'Simulation'; // Name der Datenbank (Bucket in InfluxDB 2.x)

const client = new InfluxDB({ url: 'https://eu-central-1-1.aws.cloud2.influxdata.com', token });
const writeApi = client.getWriteApi(org, bucket, 'ms');

export async function saveBatteryStatus(batteryLevel) {
    const point = new Point('battery').floatField('level', batteryLevel);

    try {
        await writeApi.writePoint(point);
        await writeApi.flush(); // Wichtig, um die Daten zu schreiben!
        console.log('Battery status saved:', batteryLevel.toFixed(2), "kWh");
    } catch (error) {
        console.error('Error saving battery status:', error);
    }
}
