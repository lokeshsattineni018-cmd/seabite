// Caching utility supporting in-memory local caching and TTL validation
const cacheMap = new Map();

let hits = 0;
let misses = 0;

/**
 * Retrieves a value from the cache
 * @param {string} key 
 * @returns {any|null}
 */
export const cacheGet = (key) => {
  const item = cacheMap.get(key);
  if (!item) {
    misses++;
    return null;
  }
  if (item.expiresAt < Date.now()) {
    cacheMap.delete(key);
    misses++;
    return null;
  }
  hits++;
  return item.value;
};

/**
 * Sets a value in the cache with a specified TTL in seconds
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 */
export const cacheSet = (key, value, ttlSeconds = 300) => {
  cacheMap.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
};

/**
 * Invalidates and clears keys matching a specific prefix
 * @param {string} prefix 
 */
export const cacheClearByPrefix = (prefix) => {
  for (const key of cacheMap.keys()) {
    if (key.startsWith(prefix)) {
      cacheMap.delete(key);
    }
  }
};

/**
 * Invalidates and clears the entire cache (useful on mutations)
 */
export const cacheClear = () => {
  cacheMap.clear();
};

/**
 * Returns cache performance metrics
 */
export const cacheStats = () => ({
  size: cacheMap.size,
  hits,
  misses,
  hitRatio: hits + misses > 0 ? (hits / (hits + misses)).toFixed(2) : 0,
});

