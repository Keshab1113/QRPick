const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const routes = require("./routes/");
const { authenticateToken } = require("./middleware/auth");

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
  transports: ['websocket', 'polling']
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Store socket.io instance
app.set("socketio", io);

// Routes
app.use("/api", routes);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  socket.on("join_session", (sessionId) => {
    socket.join(`session_${sessionId}`);
    console.log(`👤 Client ${socket.id} joined session ${sessionId}`);
    
    // Broadcast user count to session
    const room = io.sockets.adapter.rooms.get(`session_${sessionId}`);
    const userCount = room ? room.size : 0;
    io.to(`session_${sessionId}`).emit('user_count', userCount);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;
  
  res.status(statusCode).json({ 
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    server.listen(PORT, () => {
      console.log('\n🚀 Server Status:');
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ WebSocket server ready`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log('\n📡 API Endpoints:');
      console.log(`   POST   /api/auth/admin/login`);
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/qr/generate`);
      console.log(`   GET    /api/qr/sessions`);
      console.log(`   GET    /api/health`);
      console.log('\n');
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();

module.exports = { app, server, io };
