import { WebSocketServer, WebSocket } from "ws";
import http from "http";

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Video Call Server Running");
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Track connected clients (max 2)
const clients: WebSocket[] = [];
const clientIds = new Map<WebSocket, number>();

// Handle new connections
wss.on("connection", (ws) => {
  // Reject if room is full
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

  // Add client
  const clientId = clients.length;
  clients.push(ws);
  clientIds.set(ws, clientId);

  // Send client their ID
  ws.send(
    JSON.stringify({
      type: "connection",
      id: clientId,
      totalClients: clients.length,
    })
  );

  // If second client joins, notify both to start call
  if (clients.length === 2) {
    clients.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "ready",
        })
      );
    });
  }

  // Handle messages
  ws.on("message", (message) => {
    try {
      // Parse message
      const data = JSON.parse(message.toString());

      // Forward WebRTC signaling messages to the other client
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
    } catch (error) {
      // Ignore invalid messages
    }
  });

  // Handle disconnection
  ws.on("close", () => {
    // Remove client
    const index = clients.indexOf(ws);
    if (index !== -1) {
      clients.splice(index, 1);
      clientIds.delete(ws);
    }

    // Notify remaining client
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

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Video call server running on port ${PORT}`);
});
