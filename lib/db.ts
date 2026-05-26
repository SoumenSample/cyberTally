import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URL ?? process.env.MONGODB_URI ?? "";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

function getCachedConnection(): MongooseCache {
  if (!globalThis.mongoose) {
    globalThis.mongoose = {
      conn: null,
      promise: null,
    };
  }

  return globalThis.mongoose as MongooseCache;
}

export async function connectDB() {
  const cached = getCachedConnection();

  if (!MONGODB_URI) {
    throw new Error("Mongo URI missing. Set MONGODB_URL or MONGODB_URI in env.");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;

  return cached.conn;
}