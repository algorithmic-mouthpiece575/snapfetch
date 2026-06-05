/**
 * API route definitions.
 *
 * This module only wires HTTP paths to controller handlers. Dependencies
 * (controllers) are injected, which keeps the routes testable and decoupled
 * from how the services are built.
 */

import { Router } from "express";
import type { ResolveController } from "../controllers/ResolveController";
import type { DownloadController } from "../controllers/DownloadController";
import { apiRateLimiter } from "../middleware/rateLimit";

export interface Controllers {
  resolve: ResolveController;
  download: DownloadController;
}

/** Builds the `/api` router from the provided controllers. */
export function createApiRouter(controllers: Controllers): Router {
  const router = Router();

  // Rate limiting applied to every /api route.
  router.use(apiRateLimiter);

  // Simple health probe (useful for deployment / monitoring).
  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.post("/resolve", controllers.resolve.handle);
  // GET: native browser download (direct link, streaming to disk).
  // POST: same logic, exposed for programmatic API use.
  router.get("/download", controllers.download.handle);
  router.post("/download", controllers.download.handle);

  return router;
}
