const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

app.use(express.static(path.join(__dirname, 'Public')));
app.use(bodyParser.json()); // Make sure you include this to parse JSON bodies correctly

const logStream = fs.createWriteStream('sensorData.log', { flags: 'a' });

let sensorData = {
  temperature: "Loading...",
  humidity: "Loading...",
  waterLevel: "Loading..."
};

const port = new SerialPort({ path: 'COM3', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

app.get('/data', (req, res) => {
  res.json(sensorData);
});

app.post('/pump/duration', (req, res) => {
  if (!req.body.duration) {
    return res.status(400).json({ message: "Duration is required" });
  }
  const duration = parseInt(req.body.duration, 10) * 1000;
  port.write('PUMP_ON\n', (err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to send start command to pump" });
    }
    setTimeout(() => {
      port.write('PUMP_OFF\n', (err) => {
        if (err) {
          console.error('Failed to send stop command to pump');
        }
      });
    }, duration);
    res.json({ message: `Pump will run for ${req.body.duration} seconds` });
  });
});

parser.on('data', data => {
  const cleanData = data.trim();
  console.log(cleanData);
  logStream.write(new Date().toISOString() + " - " + cleanData + '\n');

  const parts = cleanData.split(", ");
  if (parts.length === 3) {
    sensorData.humidity = parts[0].split(": ")[1];
    sensorData.temperature = parts[1].split(": ")[1];
    sensorData.waterLevel = parts[2].split(": ")[1].replace('\r', '');
  }
});

const webPort = process.env.PORT || 3000;
app.listen(webPort, () => {
  console.log(`Server running on port ${webPort}`);
});

process.on('SIGINT', () => {
    console.log('Closing log file stream...');
    logStream.end();
    process.exit();
});
