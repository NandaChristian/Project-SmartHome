require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const app = express();
const server = http.createServer(app);


const { getClients } = require('./utils/websocketServer');
const { setWebSocketClients } = require('./routes/controlRoutes');

const authRoutes = require('./routes/authRoutes');
const chartRoutes = require('./routes/chartRoutes');
const logActivity = require('./routes/logActivity');
const websocketServer = require('./utils/websocketServer');




app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chart', chartRoutes);
app.use('/api/logs', logActivity);

// Inisialisasi WebSocket
websocketServer(server);

setWebSocketClients(getClients());

const PORT = process.env.PORT || 3000;
server.listen(PORT,'0.0.0.0', () => {
  console.log(`Server berjalan di port ${PORT}`);
});
