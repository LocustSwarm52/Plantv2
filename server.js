const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');
const fs = require('fs'); // Import the file system module
const app = express();

// Create a write stream to log data
const logStream = fs.createWriteStream('sensorData.log', { flags: 'a' });

// State to hold the latest sensor data
let sensorData = {
  temperature: "Loading...",
  humidity: "Loading...",
  waterLevel: "Loading..."
};

// Set up the serial port connection to the Arduino
const port = new SerialPort({ path: 'COM3', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Serve static files from the 'Public' directory
app.use(express.static(path.join(__dirname, 'Public')));

// Endpoint to get the latest sensor data
app.get('/data', (req, res) => {
  res.json(sensorData);
});

// New endpoint to trigger the pump
app.post('/pump', (req, res) => {
    port.write('PUMP_ON\n', (err) => {
        if (err) {
            return res.status(500).json({ message: "Failed to send pump command" });
        }
        res.json({ message: "Pump activated" });
    });
});

parser.on('data', data => {
  const cleanData = data.trim(); // Trim whitespace and carriage returns
  console.log(cleanData);
  logStream.write(new Date().toISOString() + " - " + cleanData + '\n');  // Log data with a timestamp

  const parts = cleanData.split(", "); // Split the cleaned data
  if (parts.length === 3) {
    sensorData.humidity = parts[0].split(": ")[1];
    sensorData.temperature = parts[1].split(": ")[1];
    sensorData.waterLevel = parts[2].split(": ")[1].replace('\r', ''); // Remove any residual carriage returns
  }
});

const webPort = process.env.PORT || 3000;
app.listen(webPort, () => {
  console.log(`Server running on port ${webPort}`);
});

// Handle graceful shutdown and close the log file stream
process.on('SIGINT', () => {
    console.log('Closing log file stream...');
    logStream.end();
    process.exit();
});
