// lib/mongodb.js
import mongoose from "mongoose";

// ─── Global-cache for hot-reload & lambda reuse ───────────────────────────────
let cached = global.mongoose          // re-use in dev / edge
  || (global.mongoose = { conn: null, promise: null });

// ─── Connection helper ───────────────────────────────────────────────────────
export async function connectToDatabase() {
  // 1️⃣  Only now read the env-var
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable not set");
  }

  // 2️⃣  Return cached connection in dev / subsequent lambda invocations
  if (cached.conn) return cached.conn;

  // 3️⃣  If not connecting yet, start & cache the promise
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      // optional but recommended:
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
