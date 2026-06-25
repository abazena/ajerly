import mongoose from "mongoose";
import { config } from "./config";
import { logger } from "./lib/logger";

export async function connectDb(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.MONGODB_URI);
  logger.info({ uri: redact(config.MONGODB_URI) }, "mongo connected");
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

function redact(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}
