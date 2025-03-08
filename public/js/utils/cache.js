const ITEM_CACHE_PREFIX = 'item_cache_';
const LIST_CACHE_PREFIX = 'list_cache_';
const ITEM_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const LIST_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export const cacheGet = (key, prefix) => {
  const cacheKey = prefix + key;
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return null;

  try {
    const { data, expiry } = JSON.parse(cached);
    if (Date.now() > expiry) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return data;
  } catch (err) {
    localStorage.removeItem(cacheKey);
    return null;
  }
};

export const cacheSet = (key, data, prefix, duration) => {
  const cacheKey = prefix + key;
  const cacheData = {
    data,
    expiry: Date.now() + duration
  };
  localStorage.setItem(cacheKey, JSON.stringify(cacheData));
};

export const getItemFromCache = (itemId) => {
  // Disabled - always return null to force fresh data fetch
  return null;
};

export const setItemInCache = (itemId, data) => {
  // Disabled - don't cache item data
  return;
};

export const getListFromCache = (params) => {
  // Disabled - always return null to force fresh data fetch
  return null;
};

export const setListInCache = (params, data) => {
  // Disabled - don't cache list data
  return;
};

export const clearItemCache = (itemId) => {
  localStorage.removeItem(ITEM_CACHE_PREFIX + itemId);
};

export const clearAllCaches = () => {
  // Clear all item and list caches
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(ITEM_CACHE_PREFIX) || key.startsWith(LIST_CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}; 