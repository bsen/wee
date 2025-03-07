const Redis = require("redis");

const client = Redis.createClient();

async function connect() {
  try {
    await client.connect();
    console.log("Redis client connected");

    client.on("error", (error) => {
      console.log("redis client error: ", error);
      return null;
    });

    return client;
  } catch (error) {
    console.log("error in connecting to redis: ", error);
    throw error;
  }
}

module.exports = { connect, client };
