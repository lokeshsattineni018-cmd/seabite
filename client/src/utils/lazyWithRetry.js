import { lazy } from "react";

// Registry to track chunk loaders for link prefetching
const chunkRegistry = {};

/**
 * Enhanced lazy import with automatic retry on ChunkLoadError.
 * Also registers the chunk loader for dynamic prefetching.
 */
export const lazyWithRetry = (componentImport, pageName) => {
  if (pageName) {
    chunkRegistry[pageName] = componentImport;
  }
  
  return lazy(async () => {
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
};

/**
 * Prefetch a registered page component's chunk in the background
 */
export const prefetchComponent = (pageName) => {
  const loader = chunkRegistry[pageName];
  if (loader) {
    loader().catch(() => {});
  }
};
