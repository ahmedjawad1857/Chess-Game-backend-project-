const socket = io(); // sends requests automatically to backend
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square.type, square.color);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
            console.log(`Drag started: ${pieceElement.innerText}`);
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
          e.dataTransfer.setData("text/plain", "");
          console.log(`Drag ended`);
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: Number(squareElement.dataset.row),
            col: Number(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q", // always promote to a queen for simplicity
  };
  console.log(
    `Move from ${source.row},${source.col} to ${target.row},${target.col}`
  );
  // Update the board state, send the move to the server, etc.
  socket.emit("move", move);
};

const getPieceUnicode = (type, color) => {
  const unicodeMap = {
    p: "♟", // Black Pawn
    r: "♜", // Black Rook
    n: "♞", // Black Knight
    b: "♝", // Black Bishop
    q: "♛", // Black Queen
    k: "♚", // Black King
    P: "♙", // White Pawn
    R: "♖", // White Rook
    N: "♘", // White Knight
    B: "♗", // White Bishop
    Q: "♕", // White Queen
    K: "♔", // White King
  };
  return color === "w"
    ? unicodeMap[type.toUpperCase()]
    : unicodeMap[type.toLowerCase()];
};

socket.on("playerRole", (role) => {
  playerRole = role;
  console.log(`Player role set: ${role}`);
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  console.log(`Spectator role set`);
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  console.log(`Move received: ${move}`);
  renderBoard();
});

renderBoard();
