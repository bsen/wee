import { WebSocketServer, WebSocket } from "ws";
import http from "http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Server Started");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("A new client has connected.");

  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    const response = handleMessage(message.toString());
    // send to the client that sent the message
    //ws.send(response);

    // send to all clients except the one that sent the message
    // wss.clients.forEach((client) => {
    //   if (client !== ws && client.readyState === WebSocket.OPEN) {
    //     client.send(response);
    //   }
    // });

    // send to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(response);
      }
    });
  });

  ws.on("close", () => {
    console.log("A client has disconnected.");
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`WebSocket server is listening on port ${PORT}`);
});

function handleMessage(message: string) {
  console.log("handleMessage", message);
  if (message === "hi") {
    return "Hello, from server";
  }
  return "Unknown message";
}

export default handleMessage;
