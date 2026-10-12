import mongoose from 'mongoose';
import { env } from './env.js';
import { setPureMode } from '../models/storeProxy.js';

export async function connectDatabase() {
  try {
    // Attempt connecting to configured MONGODB_URI with a 1.5 second timeout
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 1500,
    });
    setPureMode(false);
    console.log(`[Database] Connected successfully to external MongoDB at ${env.MONGODB_URI}`);
    return mongoose.connection;
  } catch (err) {
    setPureMode(true);
    console.log(`[Database] External MongoDB not active (${err.message}).`);
    console.log(`[Database] Engaged pure in-process storage engine (PureStore) with JSON file persistence in storage/db.`);
    return null;
  }
}

export async function disconnectDatabase() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (err) {
    console.error('[Database] Error disconnecting database:', err.message);
  }
}
