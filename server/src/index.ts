import "./types/express";
import { config } from "./config";
import { connectDb } from "./db";
import { logger } from "./lib/logger";
import { buildApp } from "./app";

async function main(): Promise<void> {
  await connectDb();
  const app = buildApp();
  app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, "ajerly server listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "fatal: failed to start");
  process.exit(1);
});
