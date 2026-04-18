import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./src/config/db.js";
import locationRoutes from "./src/routes/locationRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import alertRoutes from "./src/routes/alertRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

export { io };

connectDB();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/alert", alertRoutes);
app.use("/api/contacts", contactRoutes);

app.get("/", (req, res) => res.send("SafeGuard API Running 🚀"));

app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res
    .status(500)
    .json({ success: false, message: err.message || "Server error" });
});

io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // ✅ Add null check here
  socket.on("join_room", (userId) => {
    if (!userId) return; // ✅ Guard against null/undefined
    socket.join(userId.toString());
    socket.join(`user_${userId.toString()}`);
    console.log(`📍 User ${userId} joined personal room`);
  });

  // ✅ Add null check here
  socket.on("watch_user", (userId) => {
    if (!userId) return; // ✅ Guard against null/undefined
    socket.join(`watch_${userId.toString()}`);
    console.log(`👀 Watching user: ${userId}`);
  });

  // ✅ Add null check here
  socket.on("unwatch_user", (userId) => {
    if (!userId) return; // ✅ Guard against null/undefined
    socket.leave(`watch_${userId.toString()}`);
    console.log(`👁️ Stopped watching: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
