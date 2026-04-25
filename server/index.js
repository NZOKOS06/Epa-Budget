const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const dgRoutes = require('./routes/dg');
const dafRoutes = require('./routes/daf');
const controleurRoutes = require('./routes/controleur');
const comptableRoutes = require('./routes/comptable');
const servicesRoutes = require('./routes/services');
const tutelleRoutes = require('./routes/tutelle');
const ccdbRoutes = require('./routes/ccdb');
const notificationsRoutes = require('./routes/notifications');
const liquidationsRoutes = require('./routes/liquidations');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/dg', dgRoutes);
app.use('/api/daf', dafRoutes);
app.use('/api/controleur', controleurRoutes);
app.use('/api/comptable', comptableRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/tutelle', tutelleRoutes);
app.use('/api/ccdb', ccdbRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/liquidations', liquidationsRoutes);
app.use('/api/admin', adminRoutes);

// WebSocket pour notifications push
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  socket.on('subscribe', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Utilisateur ${userId} abonné aux notifications`);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Fonction helper pour émettre des notifications via WebSocket
global.emitNotificationSocket = (userId, notification) => {
  io.to(`user_${userId}`).emit('notification', notification);
};

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = { app, io };

