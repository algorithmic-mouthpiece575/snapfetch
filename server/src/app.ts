/**
 * Express application assembly (composition root).
 *
 * The `App` class wires every dependency in the right order:
 * yt-dlp wrapper → adapter registry → services → controllers → routes.
 * This manual wiring (hand-rolled dependency injection) keeps each layer
 * unaware of how the others are constructed.
 */

import express, { type Express } from "express";
import cors from "cors";

import { config } from "./config/env";
import { YtDlp } from "./lib/YtDlp";
import { AdapterRegistry } from "./adapters/AdapterRegistry";
import { ResolveService } from "./services/ResolveService";
import { DownloadService } from "./services/DownloadService";
import { ResolveController } from "./controllers/ResolveController";
import { DownloadController } from "./controllers/DownloadController";
import { createApiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export class App {
  /** Express instance, ready to listen. */
  public readonly server: Express;

  constructor() {
    this.server = express();
    this.configureMiddleware();
    this.configureRoutes();
    // The error handler MUST be registered last.
    this.server.use(errorHandler);
  }

  /** Global middleware: CORS, JSON parsing, proxy trust. */
  private configureMiddleware(): void {
    // Behind Caddy: trust the proxy for the real client IP
    // (required for per-IP rate limiting).
    this.server.set("trust proxy", 1);

    this.server.use(
      cors({
        origin: config.clientOrigin,
        methods: ["GET", "POST"],
      }),
    );

    // Bounded JSON body to avoid abusive payloads.
    this.server.use(express.json({ limit: "16kb" }));
  }

  /** Wires the services/controllers, then mounts the /api router. */
  private configureRoutes(): void {
    // Shared low-level dependency.
    const ytdlp = new YtDlp({
      binaryPath: config.ytdlpPath,
      timeoutMs: config.resolveTimeoutMs,
      downloadTimeoutMs: config.downloadTimeoutMs,
      cookiesFromBrowser: config.cookiesFromBrowser,
      cookiesFile: config.cookiesFile,
    });

    // Adapters (one per platform) grouped in the registry.
    const registry = new AdapterRegistry(ytdlp);

    // Business services.
    const resolveService = new ResolveService(registry);
    const downloadService = new DownloadService(registry);

    // HTTP controllers.
    const controllers = {
      resolve: new ResolveController(resolveService),
      download: new DownloadController(downloadService),
    };

    this.server.use("/api", createApiRouter(controllers));
  }
}
