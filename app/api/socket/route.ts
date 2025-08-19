import { NextResponse } from "next/server";
import { Server, Socket } from "socket.io";

// 방 데이터 구조를 위한 인터페이스
interface Player {
  id: string;
  name: string;
}

interface Room {
  players: Player[];
  spectators: string[];
  gameStarted: boolean;
  currentDrawer: number;
  word: string;
  drawingData: DrawingData[];
  chat: ChatMessage[];
  turnTimer: NodeJS.Timeout | null;
}

interface DrawingData {
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  type: "line" | "clear";
}

interface ChatMessage {
  name: string;
  message: string;
}

const rooms = new Map<string, Room>();
const words = ["apple", "house", "car", "tree", "dog", "cat", "sun", "moon"];

export async function GET(req: Request) {
  const response: any = NextResponse.next();

  // Socket.IO 서버 초기화
  if (!response.socket?.server.io) {
    console.log("Initializing Socket.IO server");

    const io = new Server(response.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" },
    });

    response.socket.server.io = io;

    io.on("connection", (socket: Socket) => {
      console.log("User connected:", socket.id);

      socket.on("joinRoom", ({ roomId, name }: { roomId: string; name: string }) => {
        if (!rooms.has(roomId)) {
          rooms.set(roomId, {
            players: [],
            spectators: [],
            gameStarted: false,
            currentDrawer: 0,
            word: "",
            drawingData: [],
            chat: [],
            turnTimer: null,
          });
        }
        const room = rooms.get(roomId)!;

        if (room.gameStarted) {
          room.spectators.push(socket.id);
          socket.join(roomId);
          socket.emit("spectatorMode", true);
          socket.emit("updateDrawing", room.drawingData);
          socket.emit("updateChat", room.chat);
          socket.emit("currentWord", room.word.replace(/./g, "_ "));
        } else if (room.players.length < 8) {
          room.players.push({ id: socket.id, name });
          socket.join(roomId);
          socket.emit("playerMode", true);
          io.to(roomId).emit("playerList", room.players.map((p) => p.name));
        } else {
          socket.emit("roomFull");
        }
      });

      socket.on("startGame", (roomId: string) => {
        const room = rooms.get(roomId);
        if (room && !room.gameStarted && room.players.some((p) => p.id === socket.id)) {
          room.gameStarted = true;
          startTurn(roomId, io, room);
          io.to(roomId).emit("gameStarted", true);
        }
      });

      socket.on("draw", ({ roomId, data }: { roomId: string; data: DrawingData }) => {
        const room = rooms.get(roomId);
        if (room && room.players[room.currentDrawer]?.id === socket.id && room.gameStarted) {
          room.drawingData.push(data);
          io.to(roomId).emit("drawUpdate", data);
        }
      });

      socket.on("chat", ({ roomId, message, name }: { roomId: string; message: string; name: string }) => {
        const room = rooms.get(roomId);
        if (room && room.gameStarted) {
          const isPlayer = room.players.some((p) => p.id === socket.id);
          if (isPlayer || room.spectators.includes(socket.id)) {
            if (
              isPlayer &&
              message.toLowerCase() === room.word.toLowerCase() &&
              room.players[room.currentDrawer]?.id !== socket.id
            ) {
              io.to(roomId).emit("correctGuess", { name, word: room.word });
              if (room.turnTimer) clearTimeout(room.turnTimer);
              nextTurn(roomId, io, room);
            } else {
              room.chat.push({ name, message });
              io.to(roomId).emit("updateChat", room.chat);
            }
          }
        }
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        rooms.forEach((room, roomId) => {
          room.players = room.players.filter((p) => p.id !== socket.id);
          room.spectators = room.spectators.filter((id) => id !== socket.id);
          if (room.players.length === 0) {
            if (room.turnTimer) clearTimeout(room.turnTimer);
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit("playerList", room.players.map((p) => p.name));
            if (room.gameStarted && room.players[room.currentDrawer]?.id === socket.id) {
              if (room.turnTimer) clearTimeout(room.turnTimer);
              nextTurn(roomId, io, room);
            }
          }
        });
      });
    });

    function startTurn(roomId: string, io: Server, room: Room) {
      room.word = words[Math.floor(Math.random() * words.length)];
      room.drawingData = [];
      room.currentDrawer = room.currentDrawer % room.players.length;
      io.to(roomId).emit("newTurn", { drawer: room.players[room.currentDrawer].name });
      io.to(room.players[room.currentDrawer].id).emit("yourWord", room.word);
      io.to(roomId).emit("hiddenWord", room.word.replace(/./g, "_ "));
      io.to(roomId).emit("clearCanvas");
      room.turnTimer = setTimeout(() => nextTurn(roomId, io, room), 60000);
    }

    function nextTurn(roomId: string, io: Server, room: Room) {
      room.currentDrawer = (room.currentDrawer + 1) % room.players.length;
      startTurn(roomId, io, room);
    }
  } else {
    console.log("Socket.IO server already initialized");
  }

  return response;
}