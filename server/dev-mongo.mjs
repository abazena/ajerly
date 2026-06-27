// Single-node replica-set Mongo for local dev. The server uses transactions,
// which require a replica set — this gives one without touching the user's
// standalone mongod on 27017. Prints the URI on stdout, then runs until SIGINT.
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { writeFileSync } from "node:fs";

const rs = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
const uri = rs.getUri("ajerly");
console.log("MONGODB_URI=" + uri);
writeFileSync(new URL("./.dev-mongo.uri", import.meta.url), uri);
process.on("SIGINT", async () => { await rs.stop(); process.exit(0); });
process.on("SIGTERM", async () => { await rs.stop(); process.exit(0); });
// keep alive
setInterval(() => {}, 1 << 30);
