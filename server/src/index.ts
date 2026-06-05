/**
 * SnapFetch server entry point.
 *
 * Starts the HTTP application and handles graceful shutdown (SIGINT/SIGTERM).
 */

// IMPORTANT: load the .env BEFORE any import that reads the configuration.
import "./loadEnv";
import { App } from "./app";
import { config } from "./config/env";

const app = new App();

const server = app.server.listen(config.port, () => {
  console.log(`SnapFetch API listening on http://localhost:${config.port}`);
  console.log(`CORS allowed for: ${config.clientOrigin}`);
});

/** Graceful shutdown: stop accepting new connections, then exit. */
function shutdown(signal: string): void {
  console.log(`\n${signal} received — shutting down...`);
  server.close(() => {
    console.log("Server stopped cleanly.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
