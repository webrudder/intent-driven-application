import NodeCache from 'node-cache';
import { config } from './index';

const cacheInstance = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: 120,
});

export { cacheInstance };

export function clearCacheByPrefix(prefix: string): void {
  const keys = cacheInstance.keys().filter(k => k.startsWith(prefix));
  cacheInstance.del(keys);
}

export function clearAllCache(): void {
  cacheInstance.flushAll();
}