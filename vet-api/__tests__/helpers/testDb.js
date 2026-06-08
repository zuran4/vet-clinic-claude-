import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

export async function connectTestDb() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

export async function clearCollections() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}
