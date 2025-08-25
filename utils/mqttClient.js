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

  const query = 'INSERT INTO logs (lokasi, status, waktu, konsumsi_daya, id_user) VALUES (?, ?, ?, ?, ?)';
db.execute(query, [
  data.lokasi,
  data.status,
  data.waktu.replace('T',' ').slice(0,19), // ubah ke format SQL 'YYYY-MM-DD HH:MM:SS'
  data.konsumsi_daya,
  data.id_user
])
.then(() => console.log('Log Google Assistant berhasil disimpan'))
.catch((err) => console.error('Gagal simpan log dari MQTT:', err));
  
  broadcastToWebSocket(data);
});

module.exports = {
  client,
  setWebSocketClients: (clients) => {
    websocketClients = clients;
  },
};
