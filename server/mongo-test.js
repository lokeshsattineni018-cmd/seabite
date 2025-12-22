import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://seabite_db_user:Lokesh18@seabitecluster.phg6xps.mongodb.net/seabite?retryWrites=true&w=majority";

async function run() {
  console.log("⏳ Starting MongoDB test...");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ MongoDB connected successfully");

    await client.db("admin").command({ ping: 1 });
    console.log("✅ Ping successful");
  } catch (err) {
    console.error("❌ MongoDB connection failed");
    console.error(err);
  } finally {
    await client.close();
    console.log("🔒 Connection closed");
  }
}

run();
