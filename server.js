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
  waterLevel: "Loading...",
  pumpStatus: "Pump status: Not running"
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
    console.log(`PUMP_ON command sent. Pump will run for ${req.body.duration} seconds.`);
    setTimeout(() => {
      port.write('PUMP_OFF\n', (err) => {
        if (err) {
          console.error('Failed to send stop command to pump');
        }
        console.log('PUMP_OFF command sent.');
      });
      sensorData.pumpStatus = `Pump was on for ${req.body.duration} seconds and is now off.`;
      console.log(`Pump has been turned off after ${req.body.duration} seconds.`);
    }, duration);
    res.json({ message: `Pump will run for ${req.body.duration} seconds` });
  });
});


parser.on('data', data => {
  const cleanData = data.trim();
  const timestamp = new Date().toISOString();
  logStream.write(timestamp + " - " + cleanData + '\n');

  const parts = cleanData.split(", ");
  if (parts.length === 3) {
    sensorData = {
      humidity: parts[0].split(": ")[1],
      temperature: parts[1].split(": ")[1],
      waterLevel: parts[2].split(": ")[1].replace('\r', ''),
      timestamp: timestamp
    };
  }
});


const webPort = process.env.PORT || 3000;
app.listen(webPort, () => {
  console.log(`Server running on port ${webPort}`);
  logStream.write("\n\n--- Server Started at " + new Date().toISOString() + " ---\n");
});


process.on('SIGINT', () => {
  console.log('Server is shutting down...');
  logStream.write("--- Server Stopped at " + new Date().toISOString() + " ---\n\n");
  logStream.end(() => {
      console.log('Log file stream closed.');
      process.exit();
  });
});

