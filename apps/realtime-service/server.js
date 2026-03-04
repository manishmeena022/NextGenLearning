import express from "express";
import { Server } from "socket.io";

const app = express();
const server = app.listen(5000);

const io = new Server(server);

io.on("connection", (socket) => {
    console.log("User connected");
});