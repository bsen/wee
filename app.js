const { WebSocketServer, WebSocket } = require("ws");
const http = require("http");
const redis = require("./redis");
const { v4: uuidv4 } = require("uuid");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Random Video Chat Server Running");
});

const wss = new WebSocketServer({ server });

const waitingClients = [];
const activePairs = new Map();

wss.on("connection", (ws) => {
  const clientId = uuidv4();
  console.log(`Client ${clientId.substring(0, 8)} connected`);

  waitingClients.push(ws);

  ws.send(
    JSON.stringify({
      type: "connection",
      id: clientId,
      message: "Waiting for a partner...",
    })
  );

  if (waitingClients.length >= 2) {
    const client1 = waitingClients.shift();
    const client2 = waitingClients.shift();

    activePairs.set(client1, client2);
    activePairs.set(client2, client1);

    [client1, client2].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "paired",
            message:
              "You've been paired with someone! You can start your call.",
          })
        );
      }
    });
  }

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(
        `Received message type: ${data.type} from client ${clientId.substring(
          0,
          8
        )}`
      );

      if (
        data.type === "offer" ||
        data.type === "answer" ||
        data.type === "ice-candidate"
      ) {
        const partner = activePairs.get(ws);
        if (partner && partner.readyState === WebSocket.OPEN) {
          partner.send(message.toString());
        }
      }
    } catch (error) {
      console.log("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    const waitingIndex = waitingClients.indexOf(ws);
    if (waitingIndex !== -1) {
      waitingClients.splice(waitingIndex, 1);
    }

    const partner = activePairs.get(ws);
    if (partner) {
      activePairs.delete(partner);
      activePairs.delete(ws);

      if (partner.readyState === WebSocket.OPEN) {
        partner.send(
          JSON.stringify({
            type: "partnerLeft",
            message:
              "Your partner has disconnected. Waiting for a new partner...",
          })
        );

        waitingClients.push(partner);
      }
    }

    console.log(`Client ${clientId.substring(0, 8)} disconnected`);
  });

  ws.on("error", (error) => {
    console.log(`WebSocket error: ${error.message}`);
  });
});

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    await redis.connect();
    server.listen(PORT, () => {
      console.log(`WebSocket server running at \nws://localhost:${PORT}`);
    });
  } catch (error) {
    console.log("error in starting server: ", error);
    throw error;
  }
}

startServer().catch(console.error);
