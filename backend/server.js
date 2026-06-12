const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config({ path: __dirname + '/../.env' });

const connectDB = require('./config/db');
const socketController = require('./controllers/socketController');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', require('./routes/authRoutes'));

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

socketController(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Dealer server is live on port ${PORT}`));