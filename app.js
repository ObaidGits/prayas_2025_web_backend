import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./db/index.js";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config({ path: "./.env" });

// Init express
const app = express();

// Convert ES module __dirname
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

// Static file serving
app.use("/cctv_sos", express.static(path.join(__dirname, "public/cctv_sos")));

// Routes
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import webSosRouter from "./routes/websos.routes.js";
import cctvSosRouter from "./routes/cctvsos.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/sos", webSosRouter);
app.use("/api/v1/cctv", cctvSosRouter);
// Root route to confirm server is running
app.get("/", (req, res) => {
  res.send("🚀 Your Backend Server is Running");
});

// Create server
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Socket.io logic
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Export for controllers to use socket emit
export const broadcastNewAlert = (alert) => {
  io.emit("new_alert", alert);
};

// Connect to DB and start server
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000;
    httpServer.listen(PORT, () =>
      console.log(`✅ Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed!", err);
    process.exit(1);
  });
