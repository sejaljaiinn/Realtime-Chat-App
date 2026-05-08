import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const userSocketMap = {}; // userId -> socketId

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}





io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("register", (userId) => {
    if (!userId) return;

    userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // 🔥 IMPORTANT: prevent duplicate listeners
  socket.removeAllListeners("sendMessage");

  socket.on("sendMessage", (message) => {
    const receiverSocketId = userSocketMap[message.receiverId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }
  });

  socket.on("disconnect", () => {
    for (const id in userSocketMap) {
      if (userSocketMap[id] === socket.id) {
        delete userSocketMap[id];
        break;
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});
export { io, app, server };