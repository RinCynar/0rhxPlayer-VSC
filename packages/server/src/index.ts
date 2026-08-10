import { SETTING_DIR } from "./constant.js";
import { logError } from "./utils.js";
import { mkdir } from "node:fs/promises";

// Start the local IPC servers and the native player (side-effect imports).
import "./server.js";

process.on("unhandledRejection", logError);
process.on("uncaughtException", logError);

await mkdir(SETTING_DIR, { recursive: true });
