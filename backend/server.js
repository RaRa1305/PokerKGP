const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config({ path: __dirname + '/../.env' });

const connectDB = require('./config/db');
const socketController = require('./controllers/socketController');

connectDB();
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("PORT:", process.env.PORT);

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ["GET", "POST"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', require('./routes/authRoutes'));

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions
});

socketController(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Dealer server is live on port ${PORT}`));