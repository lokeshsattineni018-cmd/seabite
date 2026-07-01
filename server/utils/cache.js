// Caching utility supporting in-memory local caching and TTL validation
const cacheMap = new Map();

/**
 * Retrieves a value from the cache
 * @param {string} key 
 * @returns {any|null}
 */
export const cacheGet = (key) => {
  const item = cacheMap.get(key);
  if (!item) return null;
  if (item.expiresAt < Date.now()) {
    cacheMap.delete(key);
    return null;
  }
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
 * Invalidates and clears the entire cache (useful on mutations)
 */
export const cacheClear = () => {
  cacheMap.clear();
};
