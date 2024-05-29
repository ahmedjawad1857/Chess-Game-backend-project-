const express = require("express");
const http = require("http");
const { Chess } = require("chess.js");
const socket = require("socket.io");
const path = require("path");
const port = "5000"; // creating a port
const app = express();
const server = http.createServer(app); // linking http server and express server
const io = socket(server); // linking http server and socket server

const chess = new Chess(); // creating new chess game...

let players = {}; // creating an object of players

let currentPlayer = "w"; // creating current player move with white Pawn  etc.

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

// socket setup

io.on("connection", (uniqueSocket) => {
  // Logging the array of rooms
  console.log("A user is joined.");
  if (!players.white) {
    players.white = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "b");
  } else {
    uniqueSocket.emit("spectatorRole ");
  }

  uniqueSocket.on("disconnect", () => {
    console.log("A user is disconnected.");
    if (players.white === uniqueSocket.id) {
      delete players.white;
    } else if (players.black === uniqueSocket.id) {
      delete players.black;
    }
  });

  uniqueSocket.on("move", (move) => {
    try {
      // checking if user run valid move...
      if (
        (chess.turn() === "w" && players.white !== uniqueSocket.id) ||
        (chess.turn() === "b" && players.black !== uniqueSocket.id)
      )
        return;
      // if (chess.turn() === "b" && players.black !== uniqueSocket.id) return;
      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log(`Invalid move: ${move}`);
        uniqueSocket.emit("invalidMove", move);
      }
    } catch (error) {
      console.log(error);
      uniqueSocket.emit("invalidMove", move);
    }
  });
});

server.listen(port, () => {
  console.log("Server is running on port " + port);
});
