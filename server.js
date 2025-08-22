require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  const privateKey = fs.readFileSync('./ssl/key.pem', 'utf8');
  const certificate = fs.readFileSync('./ssl/cert.pem', 'utf8');
  const credentials = { key: privateKey, cert: certificate };
  server = https.createServer(credentials, app);
  console.log('[HTTPS] Production mode');
} else {
  server = http.createServer(app);
  console.log('[HTTP] Development mode');
}


// Middleware
app.use(express.json());
app.use(cors({
  origin: "*"
}));

// Routes
const authRoutes = require('./routes/authRoutes');
const chartRoutes = require('./routes/chartRoutes');
const logActivity = require('./routes/logActivity');
app.use('/api/auth', authRoutes);
app.use('/api/chart', chartRoutes);
app.use('/api/logs', logActivity);

// WebSocket setup
const { getClients } = require('./utils/websocketServer');
const { setWebSocketClients } = require('./routes/controlRoutes');
const websocketServer = require('./utils/websocketServer');

// Start server
const server = http.createServer(app);

const PORT = process.env.PORT || 3000; 
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

websocketServer(server);
setWebSocketClients(getClients());
