/** Prepare Vite's static output for the production Sites runtime. */
import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const serverDirectory = path.join(projectRoot, "dist", "server");

await mkdir(serverDirectory, { recursive: true });
await copyFile(
  path.join(projectRoot, "worker", "index.js"),
  path.join(serverDirectory, "index.js"),
);
