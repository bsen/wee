const { client } = require("./redis");

async function storeClientId(clientId) {
  console.log("Storing clientId: ", clientId);
  const result = await client.set("clientId", clientId);
  return result;
}

async function getClientId() {
  const result = await client.get("clientId");
  console.log("ClientId retrieved from redis: ", result);
  return result;
}

module.exports = { storeClientId, getClientId };
