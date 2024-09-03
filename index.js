const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8081",
      "https://locationtest-mmy5.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:8081",
      "https://locationtest-mmy5.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.post("/getRoute", async (req, res) => {
  console.log(req.body);
  const { start, end } = req.body;

  const url = `http://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=false`;

  try {
    const response = await axios.get(url);
    const route = response.data.routes[0];
    const coordinates = route.geometry?.coordinates.map((coord) => ({
      latitude: coord[1],
      longitude: coord[0],
    }));

    io.emit("route", [coordinates, route.distance / 1000, route.duration / 60]);
  } catch (error) {
    console.error("Error fetching route from OSRM:", error);
  }
});

io.on("connection", (socket) => {
  socket.on("locationUpdate", (location) => {
    io.emit("locationUpdate", [
      location?.coords?.latitude,
      location?.coords.longitude,
    ]);
  });
  socket.on("sendLocation", () => {
    io.emit("sendLocation");
  });

  socket.on("disconnect", () => {
    io.emit("disconnecta");
  });

  socket.on("car", (e) => {
    io.emit("car", e);
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
