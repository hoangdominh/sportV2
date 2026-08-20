import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI. Copy .env.example to .env and fill MongoDB connection string.");
}

const mongoUri = uri;

const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123456";
const members = (process.env.MEMBER_USERS ?? "an:an123456,binh:binh123456,chi:chi123456")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [username, password = `${entry}123456`] = entry.split(":");
    return { username: username.toLowerCase(), password, name: username };
  });

async function upsertUser(client: MongoClient, user: { username: string; password: string; name: string; role: "admin" | "member" }) {
  const passwordHash = await bcrypt.hash(user.password, 12);
  await client.db().collection("users").updateOne(
    { username: user.username },
    {
      $set: {
        name: user.name,
        username: user.username,
        passwordHash,
        role: user.role
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );
}

async function main() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  await upsertUser(client, {
    username: adminUsername.toLowerCase(),
    password: adminPassword,
    name: "Admin",
    role: "admin"
  });

  for (const member of members) {
    await upsertUser(client, { ...member, role: "member" });
  }

  await client.db().collection("users").createIndex({ username: 1 }, { unique: true });
  await client.close();
  console.log(`Seeded admin '${adminUsername}' and ${members.length} member(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
