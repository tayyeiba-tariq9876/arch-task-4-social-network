const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "Orbit realtime server" }));

io.on("connection", (socket) => {
  socket.emit("server:connected", { message: "Connected to Orbit real-time updates", at: new Date().toISOString() });
  socket.on("post:created", (payload) => socket.broadcast.emit("feed:update", { type: "post", payload }));
  socket.on("post:liked", (payload) => socket.broadcast.emit("feed:update", { type: "like", payload }));
  socket.on("comment:created", (payload) => socket.broadcast.emit("feed:update", { type: "comment", payload }));
  socket.on("friend:request", (payload) => socket.broadcast.emit("notification:new", { type: "friend", payload }));
  socket.on("notification:read", (payload) => socket.broadcast.emit("notification:read", payload));
  socket.on("profile:updated", (payload) => socket.broadcast.emit("feed:update", { type: "profile", payload }));
  socket.on("disconnect", () => {});
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Orbit Socket.IO server listening on http://localhost:${PORT}`));