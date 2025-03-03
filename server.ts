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
  console.log("New client connected");

  if (clients.length >= 2) {
    console.log("Room is full, rejecting connection");
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

  console.log(
    `Client #${clientId} connected. Total clients: ${clients.length}`
  );

  ws.send(
    JSON.stringify({
      type: "connection",
      id: clientId,
      totalClients: clients.length,
    })
  );

  if (clients.length === 2) {
    console.log("Two clients connected, starting call");
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
      console.log(
        `Received message type: ${data.type} from client #${clientIds.get(ws)}`
      );

      if (
        data.type === "offer" ||
        data.type === "answer" ||
        data.type === "ice-candidate"
      ) {
        const otherClient = clients.find((client) => client !== ws);
        if (otherClient && otherClient.readyState === WebSocket.OPEN) {
          console.log(`Forwarding ${data.type} to other client`);
          otherClient.send(message.toString());
        }
      }
    } catch (error) {
      console.log("Error processing message");
    }
  });

  ws.on("close", () => {
    const clientId = clientIds.get(ws);
    const index = clients.indexOf(ws);

    if (index !== -1) {
      clients.splice(index, 1);
      clientIds.delete(ws);
      console.log(
        `Client #${clientId} disconnected. Remaining clients: ${clients.length}`
      );
    }

    if (clients.length > 0) {
      console.log("Notifying remaining client about disconnection");
      clients.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "disconnected",
          })
        );
      });
    }
  });

  ws.on("error", (error) => {
    console.log(`WebSocket error: ${error.message}`);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running at ws://localhost:${PORT}`);
});
