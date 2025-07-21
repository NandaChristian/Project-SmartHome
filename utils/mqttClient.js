const mqtt = require('mqtt');
const db = require('./db');
const WebSocket = require('ws');

const brokerUrl = process.env.MQTT_BROKER || 'mqtt://io.adafruit.com';
const client = mqtt.connect(brokerUrl, {
  username: process.env.AIO_USERNAME,
  password: process.env.AIO_KEY,
});

let websocketClients = [];

function broadcastToWebSocket(data) {
  websocketClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

try {
  client.on('connect', () => {
    console.log('Terhubung ke broker MQTT');
    client.subscribe(`${process.env.AIO_USERNAME}/feeds/lampu_kamar`);
    client.subscribe(`${process.env.AIO_USERNAME}/feeds/lampu_ruang_tamu`);
    client.subscribe(`${process.env.AIO_USERNAME}/feeds/lampu_teras`);
    client.subscribe(`${process.env.AIO_USERNAME}/feeds/semua_lampu`);
  });
} catch (err) {
  console.error('Error handler connect:', err);
}

console.log('Broker:', process.env.MQTT_BROKER);

client.on('message', (topic, message) => {
  const payload = message.toString();


  // Tentukan lokasi berdasarkan feed
  let lokasi = null;
  if (topic.endsWith('lampu_kamar')) lokasi = 'Kamar';
  else if (topic.endsWith('lampu_ruang_tamu')) lokasi = 'Ruang Tamu';
  else if (topic.endsWith('lampu_teras')) lokasi = 'Teras';
  

  if (!lokasi) return;

  const status = payload === '1' ? 'ON' : 'OFF';

  const data = {
    lokasi,
    status,
    konsumsi_daya: 0,
    id_user: 3,
    waktu: new Date().toISOString(),
  };
  
  broadcastToWebSocket(data);
});

module.exports = {
  client,
  setWebSocketClients: (clients) => {
    websocketClients = clients;
  },
};
