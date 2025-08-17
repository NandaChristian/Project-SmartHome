const WebSocket = require('ws');
const db = require('./db');
const mqttClient = require('./mqttClient');

let clients = []; // Semua client WebSocket aktif (ESP32 + frontend)
let pendingRequests = {}; // Untuk sinkronisasi respons ESP32


function getClients() {
  return clients;
}

const statusWaktuNyala = {}; // Menyimpan waktu ON terakhir tiap perangkat

const statusPerangkat = {
  Kamar: null,
  'Ruang Tamu': null,
  Teras: null,
  Kipas:null 
};

const dayaPerangkat = {
  Kamar: 5,
 'Ruang Tamu': 5,
  Teras: 5,
  Kipas: 25
};

// Fungsi menghitung konsumsi daya berdasarkan durasi ON
function hitungKonsumsiDaya(lokasi, waktuSekarang) {
  const waktuOn = statusWaktuNyala[lokasi];
  if (!waktuOn) return 0;

  const durasiMs = waktuSekarang - waktuOn;
  const durasiJam = durasiMs / (1000 * 60 * 60);
  const daya = dayaPerangkat[lokasi] || 0;

  return parseFloat((daya * durasiJam).toFixed(2));
}

function getDeviceStatesForFrontend() {
  return {
    kipas: statusPerangkat.Kipas === 'ON',
    lampuKamar: statusPerangkat.Kamar === 'ON',
    lampuRuangTamu: statusPerangkat['Ruang Tamu'] === 'ON',
    lampuTeras: statusPerangkat.Teras === 'ON',
  };
}

// Fungsi untuk mengirim status terkini ke client
function sendCurrentStatusToClient(ws) {
  const deviceStates = getDeviceStatesForFrontend();
  const statusResponse = {
    action: "STATUS_RESPONSE",
    devices: deviceStates,
    timestamp: new Date().toISOString()
  };
  
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(statusResponse));
    // console.log('Status terkini dikirim ke client:', deviceStates);
  }
}

module.exports = function (server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    // Semua client yang terhubung (ESP32 atau React) dimasukkan ke array
    clients.push(ws);
    mqttClient.setWebSocketClients(clients);
    console.log('Client baru terhubung ke WebSocket (belum teridentifikasi)');

    // Bagian untuk FRONTEND:
    // Kirim status awal ke client frontend yang baru terhubung
    Object.entries(statusPerangkat).forEach (([lokasi, status]) => {
      if (status !== null) {
      const initData = {
        lokasi,
        status: statusWaktuNyala[lokasi] ? 'ON' : 'OFF', 
        konsumsi_daya: 0.0, // belum tahu karena belum OFF
        id_user: 2 
      };
      ws.send(JSON.stringify(initData)); // Kirim status awal ke frontend
    }
    });

    // Saat menerima pesan dari client (ESP32 atau frontend)
    ws.on('message', (message) => {
      let parsed;
      try {
        parsed = JSON.parse(message);
      } catch (err) {
        console.error('Format JSON tidak valid:', err);
        return;
      }

      // IDENTIFIKASI CLIENT
      // Digunakan saat client baru konek: frontend atau esp32
      if (parsed.type === 'init' && parsed.client) {
        if (['frontend', 'esp32'].includes(parsed.client)) {
          ws.clientType = parsed.client;
          console.log(`Client teridentifikasi sebagai: ${ws.clientType}`);
        } else {
          ws.clientType = 'unknown';
          console.warn(`Client tidak dikenal: ${parsed.client}`);
        }
        return; // Selesai untuk inisialisasi
      }

      // HANDLE REQUEST STATUS (dari frontend)
      if (parsed.action === 'GET_STATUS') {
        sendCurrentStatusToClient(ws);
        return; // selesai di sini, tidak perlu proses lebih lanjut
      }

      // Bagian untuk ESP32:
      // ESP32 akan mengirimkan status ON atau OFF
      const lokasi = parsed.lokasi;
      const status = parsed.status;
      const id_user = parsed.id_user;
      const waktuSekarang = new Date();

      if (!lokasi || !status || id_user === undefined) {
        console.warn('Data tidak lengkap', parsed);
        return;
      }

      // Tangani respons balik dari ESP32 ke backend (via pendingRequests)
      const key = `${lokasi}_${id_user}`;
      if (pendingRequests[key]) {
        pendingRequests[key](true);
        delete pendingRequests[key];
      }

      if (lokasi === 'Semua Lampu') {
        const lokasiLampu = ['Kamar', 'Ruang Tamu', 'Teras'];
        lokasiLampu.forEach((namaLampu) => {
          statusPerangkat[namaLampu] = status;
          
        // Update waktu nyala jika ON
          if (status === 'ON') {
            statusWaktuNyala[namaLampu] = waktuSekarang;
          } else if (status === 'OFF') {
            delete statusWaktuNyala[namaLampu];
          }

          const dataLampu = {
            lokasi: namaLampu,
            status,
            konsumsi_daya: 0,
            id_user: 99
          };

          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(dataLampu));
            }
          });
          console.log (`(broadcast UI only) [${namaLampu}] ${status}`);
        });
        return;
      }

      statusPerangkat[lokasi] = status;

      let konsumsi_daya = 0;

      // Jika perangkat dinyalakan, catat waktunya
      if (status === 'ON') {
        statusWaktuNyala[lokasi] = waktuSekarang;

      // Jika perangkat dimatikan, hitung konsumsi daya
      } else if (status === 'OFF') {
        konsumsi_daya = hitungKonsumsiDaya(lokasi, waktuSekarang);
        delete statusWaktuNyala[lokasi]; // reset waktu ON agar tidak dobel hitung
      }

      const data = {
        lokasi,
        status,
        konsumsi_daya,
        id_user
      };

      console.log(`Data dari ${ws.clientType || 'unknown'}:`, data);

      // Simpan ke database (dari ESP32 atau dari kontrol via React/Google Assistant)
      const waktuWIB = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });


      const query = 'INSERT INTO logs (lokasi, status, waktu, konsumsi_daya, id_user) VALUES (?, ?, ?, ?, ?)';
      db.execute(query, [lokasi, status, waktuWIB, konsumsi_daya, id_user])
        .then(() => console.log('Log berhasil disimpan'))
        .catch((err) => console.error('Gagal simpan log:', err));

      // Kirim feedback ke semua client
      // Termasuk frontend React agar dashboard real-time update
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data)); // broadcast ke semua client
        }
      });
    });

    // Handle disconnect dari ESP32 atau React
    ws.on('close', () => {
      clients = clients.filter((client) => client !== ws);
      mqttClient.setWebSocketClients(clients);
      console.log(`Client WebSocket (${ws.clientType || 'unknown'}) terputus`);
    });
  });

  // Export sinkronisasi untuk route control
  module.exports.waitForESP32Response = function (lokasi, id_user, timeoutMs = 2000) {
    return new Promise((resolve, reject) => {
      const key = `${lokasi}_${id_user}`;

      const timer = setTimeout(() => {
        delete pendingRequests[key];
        reject(new Error('ESP32 tidak merespon'));
      }, timeoutMs);

      pendingRequests[key] = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  };
};


module.exports.getClients = getClients;