import { MongoClient } from "mongodb";

const options = {};

let clientPromise: Promise<MongoClient> | undefined;

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

export function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (process.env.NODE_ENV === "development") {
    if (!globalForMongo._mongoClientPromise) {
      globalForMongo._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    return globalForMongo._mongoClientPromise;
  }

  clientPromise ??= new MongoClient(uri, options).connect();
  return clientPromise;
}

export async function getDb() {
  const connectedClient = await getMongoClient();
  return connectedClient.db();
}

export default getMongoClient;
