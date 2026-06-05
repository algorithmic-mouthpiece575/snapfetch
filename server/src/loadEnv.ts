/**
 * Loads the `.env` file — must be imported FIRST (side effect).
 *
 * `tsx`/Node do not load `.env` automatically. We do it here via
 * `process.loadEnvFile` (native since Node 20.12), BEFORE `config/env.ts` reads
 * `process.env`. This module's import must therefore precede any import that
 * depends on the configuration.
 *
 * If the file is missing (production where variables are injected differently),
 * we silently skip: defaults / environment-provided values take over.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");

// `loadEnvFile` may not exist on very old Node versions.
const loadEnvFile = (
  process as unknown as { loadEnvFile?: (path?: string) => void }
).loadEnvFile;

if (typeof loadEnvFile === "function" && existsSync(envPath)) {
  loadEnvFile(envPath);
}
