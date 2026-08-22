import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  await Promise.all([
    db.collection("transactions").createIndex({ createdAt: -1 }, { name: "transactions_createdAt_desc" }),
    db.collection("transactions").createIndex({ status: 1, createdAt: -1 }, { name: "transactions_status_createdAt" }),
    db.collection("transactions").createIndex({ eventId: 1, status: 1 }, { name: "transactions_eventId_status" }),
    db.collection("events").createIndex({ date: -1 }, { name: "events_date_desc" }),
    db.collection("users").createIndex({ username: 1 }, { name: "users_username_unique", unique: true })
  ]);

  console.log("MongoDB indexes are ready.");
  await client.close();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
