const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  socket.on("userInfo", (data) => {
    socket.name = data.name;
    socket.location = data.location;

    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      // First user becomes caller
      waitingUser.emit("connected", {
        partnerName: socket.name,
        partnerLocation: socket.location,
        isCaller: true
      });

      // Second user receives
      socket.emit("connected", {
        partnerName: waitingUser.name,
        partnerLocation: waitingUser.location,
        isCaller: false
      });

      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on("offer", (offer) => {
    if (socket.partner) {
      socket.partner.emit("offer", offer);
    }
  });

  socket.on("answer", (answer) => {
    if (socket.partner) {
      socket.partner.emit("answer", answer);
    }
  });

  socket.on("ice-candidate", (candidate) => {
    if (socket.partner) {
      socket.partner.emit("ice-candidate", candidate);
    }
  });

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("partnerDisconnected");
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});