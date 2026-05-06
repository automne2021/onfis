type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const STORAGE_PREFIX = "onfis:cache:";
const memoryCache = new Map<string, CacheEntry<unknown>>();

function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isValidEntry(entry: CacheEntry<unknown>): boolean {
  return entry.expiresAt > Date.now();
}

export function getCachedResource<T>(key: string): T | null {
  const memoryEntry = memoryCache.get(key);
  if (memoryEntry) {
    if (isValidEntry(memoryEntry)) {
      return memoryEntry.value as T;
    }

    memoryCache.delete(key);
  }

  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const storageKey = getStorageKey(key);
  const raw = storage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.expiresAt !== "number") {
      storage.removeItem(storageKey);
      return null;
    }

    if (!isValidEntry(parsed as CacheEntry<unknown>)) {
      storage.removeItem(storageKey);
      return null;
    }

    memoryCache.set(key, parsed as CacheEntry<unknown>);
    return parsed.value;
  } catch {
    storage.removeItem(storageKey);
    return null;
  }
}

export function setCachedResource<T>(key: string, value: T, ttlMs: number): void {
  const normalizedTtl = Math.max(ttlMs, 1000);
  const entry: CacheEntry<T> = {
    value,
    expiresAt: Date.now() + normalizedTtl,
  };

  memoryCache.set(key, entry as CacheEntry<unknown>);

  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(getStorageKey(key), JSON.stringify(entry));
  } catch {
    // Ignore storage quota and serialization errors.
  }
}

export function clearCachedResource(key: string): void {
  memoryCache.delete(key);

  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(getStorageKey(key));
}

export function clearCachedResourceByPrefix(prefix: string): void {
  const cacheKeys = Array.from(memoryCache.keys());
  for (const key of cacheKeys) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  const storageKeys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const currentKey = storage.key(i);
    if (currentKey && currentKey.startsWith(STORAGE_PREFIX)) {
      storageKeys.push(currentKey);
    }
  }

  for (const storageKey of storageKeys) {
    const rawKey = storageKey.slice(STORAGE_PREFIX.length);
    if (rawKey.startsWith(prefix)) {
      storage.removeItem(storageKey);
    }
  }
}
