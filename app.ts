import { WebSocketServer, WebSocket } from "ws";
import http from "http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Video Call Server Running");
});

const wss = new WebSocketServer({ server });

const clients: WebSocket[] = [];
const clientIds = new Map<WebSocket, number>();

wss.on("connection", (ws) => {
  console.log("Client connected");
  if (clients.length >= 2) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Room is full",
      })
    );
    ws.close();
    return;
  }

  const clientId = clients.length;
  clients.push(ws);
  clientIds.set(ws, clientId);

  console.log("Client connected", clientId);

  ws.send(
    JSON.stringify({
      type: "connection",
      id: clientId,
      totalClients: clients.length,
    })
  );

  if (clients.length === 2) {
    clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "ready",
        })
      );
    });
  }

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (
        data.type === "offer" ||
        data.type === "answer" ||
        data.type === "ice-candidate"
      ) {
        const otherClient = clients.find((client) => client !== ws);
        if (otherClient && otherClient.readyState === WebSocket.OPEN) {
          otherClient.send(message.toString());
        }
      }
    } catch (error) {}
  });

  ws.on("close", () => {
    const index = clients.indexOf(ws);
    if (index !== -1) {
      clients.splice(index, 1);
      clientIds.delete(ws);
    }

    if (clients.length > 0) {
      clients.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "disconnected",
          })
        );
      });
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`ws://localhost:${PORT}`);
});
