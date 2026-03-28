import { lazy } from "react";

/**
 * Enhanced lazy import with automatic retry on ChunkLoadError.
 * Useful for handling Vite/Vercel deployments where old chunks are deleted.
 */
export const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.localStorage.getItem("page_has_been_force_refreshed") || "false"
    );

    try {
      const component = await componentImport();
      window.localStorage.setItem("page_has_been_force_refreshed", "false");
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // ChunkLoadError detected - likely a new deployment
        window.localStorage.setItem("page_has_been_force_refreshed", "true");
        return window.location.reload();
      }

      // If we already refreshed once and it still fails, bubble up the error
      throw error;
    }
  });
