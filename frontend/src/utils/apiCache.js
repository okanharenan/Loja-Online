const store = new Map();

export function withCache(key, fetcher, ttlMs = 60_000) {
  const entry = store.get(key);
  const now = Date.now();

  if (entry) {
    if (entry.promise) return entry.promise; // já tem uma busca em andamento
    if (entry.expiresAt > now) return Promise.resolve(entry.data);
  }

  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .catch((err) => {
      store.delete(key); // nunca guarda erro em cache
      throw err;
    });

  store.set(key, { promise });
  return promise;
}


export function invalidateCache(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}