const express = require("express");
const router = express.Router();

let clients = []; // perlu diimport dari modul websocket kalau dipisah

// Ini bisa di-export dari modul websocket agar tersedia di route ini
function setWebSocketClients(list) {
  clients = list;
}

function waitForResponse(lokasi, timeout = 2000) {
  return new Promise((resolve, reject) => {
    let settled = false;
  

    function handler(message) {
      try {
        const data = JSON.parse(message);
        if (data.lokasi === lokasi) {
          settled = true;
          cleanup();

         
          resolve(data);
        }
      } catch (e) {}
    }

    function cleanup() {
      clients.forEach((client) => {
        client.removeListener("message", handler);
      });
    }

    clients.forEach((client) => {
      client.on("message", handler);
    });

    setTimeout(() => {
      if (!settled) {
        cleanup();
        reject(new Error("Timeout menunggu respon dari ESP32"));
      }
    }, timeout);
  });
}

router.post("/control", async (req, res) => {
  const { lokasi, status, id_user } = req.body;

  if (!lokasi || !status || id_user === undefined) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  // Kirim perintah ke ESP32 via WebSocket
  let berhasilKirim = false;
  clients.forEach((client) => {
    if (client.clientType === "esp32" && client.readyState === 1) {
      client.send(JSON.stringify({ lokasi, status, id_user }));
      berhasilKirim = true;
    }
  });

  if (!berhasilKirim) {
    return res.status(500).json({ message: "ESP32 tidak aktif atau tidak terhubung" });
  }
  
  try {
    const feedback = await waitForResponse(lokasi);
    return res.status(200).json({ 
      message: `Perintah ${status} ke ${lokasi} dikonfirmasi oleh ESP32`, 
      feedback
    });
  } catch (error) {
    return res.status(504).json({ message: error.message });
  }
});

module.exports = { router, setWebSocketClients };
