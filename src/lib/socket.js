import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken"; // 👈 تثبيته عبر npm install jsonwebtoken
import dotenv from "dotenv"; // 👈 تأكد من تحميل المتغيرات

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["https://aliabdulghani.github.io"], // عدّل عند النشر
    },
});

// 👥 لتخزين المستخدمين المتصلين
const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

// ✅ التحقق من التوكن قبل السماح بالاتصال
io.use((socket, next) => {
    const token = socket.handshake.query.token;

    if (!token) {
        return next(new Error("❌ Authentication error: No token provided"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // الآن كل socket يملك بيانات المستخدم
        next();
    } catch (err) {
        return next(new Error("❌ Authentication error: Invalid token"));
    }
});

io.on("connection", (socket) => {
    const userId = socket.user.id; // من داخل التوكن
    console.log("✅ User connected:", socket.id, "User ID:", userId);

    // إضافة المستخدم إلى قائمة المتصلين
    if (userId) userSocketMap[userId] = socket.id;

    // إرسال قائمة المتصلين للجميع
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, app, server };
