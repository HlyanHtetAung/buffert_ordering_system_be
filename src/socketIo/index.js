const socketConnections = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("message", (msg) => {
      console.log("Message", msg);
      io.emit("message", msg); // Broadcast the message to all clients
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};

module.exports = socketConnections;
