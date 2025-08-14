require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();

// Middleware
app.use(cors({
  origin: "*"
}));
app.use(express.json());

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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

websocketServer(server);
setWebSocketClients(getClients());
