import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./db/index.js";
import path from "path";
import { fileURLToPath } from "url";

// Load env vars
dotenv.config({ path: "./.env" });

// Express setup
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Serve static assets
app.use("/cctv_sos", express.static(path.join(__dirname, "public/cctv_sos")));
app.use("/web_sos", express.static(path.join(__dirname, "public/web_sos")));
app.use("/user_imgs", express.static(path.join(__dirname, "public/user_imgs")));

// API Routes
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import webSosRouter from "./routes/websos.routes.js";
import cctvSosRouter from "./routes/cctvsos.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/sos", webSosRouter);
app.use("/api/v1/cctv", cctvSosRouter);

// Health check
app.get("/", (req, res) => {
  res.send("🚀 Your Backend Server is Running");
});

// Create HTTP + Socket.IO server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// --- Socket Logic ---
const userSocketMap = new Map();

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Register user
  socket.on("register_user", ({ userId }) => {
    userSocketMap.set(userId, socket.id);
    socket.join(userId);
    console.log(`📲 User registered and joined room: ${userId}`);
  });

  // Admin requests stream
  socket.on("request_live_video", ({ targetUserId }) => {
    console.log(`📡 Admin requests live stream from: ${targetUserId}`);
    io.to(targetUserId).emit("request_live_video", { targetUserId });
  });

  // Admin refreshes — ask user to re-send offer
  socket.on("reconnect_user_stream", ({ userId }) => {
    console.log(`🔁 Admin requested re-send from: ${userId}`);
    io.to(userId).emit("reconnect_user_stream", { userId });
  });

  // User rejected stream
  socket.on("live_stream_rejected", ({ userId }) => {
    console.log(`🚫 User ${userId} rejected live stream`);
    io.emit("live_stream_rejected", { userId });
  });

  // User stopped stream
  socket.on("live_stream_stopped", ({ userId }) => {
    console.log(`⛔ User ${userId} stopped live stream`);
    io.emit("live_stream_stopped", { userId });
  });

  // WebRTC Signaling Events
  socket.on("join-room", ({ roomId, role }) => {
    socket.join(roomId);
    console.log(`🟢 ${role} joined room: ${roomId}`);
    socket.to(roomId).emit("user-joined", { role });
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // Disconnect cleanup
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    for (const [userId, sId] of userSocketMap.entries()) {
      if (sId === socket.id) {
        userSocketMap.delete(userId);
        console.log(`🧹 Cleaned user mapping for: ${userId}`);
        break;
      }
    }
  });
});

// Broadcast helper function
export const broadcastNewAlert = (alert) => {
  io.emit("new_alert", alert);
};

// Connect to DB and start server
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000;
    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed!", err);
    process.exit(1);
  });
