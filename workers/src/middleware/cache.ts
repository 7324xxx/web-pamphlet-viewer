/**
 * Cache Middleware
 * Handles Cache API integration for tile responses
 */

import { Context } from 'hono';
import type { Env, Variables } from '../types/bindings';
import {
  getTileCacheKey,
  getTileFromCache,
  putTileIntoCache,
  getTileCacheHeaders,
} from '../services/cache';

/**
 * Tile cache middleware
 * Checks Cache API before handler execution and stores response after
 *
 * Prerequisites:
 * - pamphletId must be in route params as 'id'
 * - hash must be in route params as 'hash'
 * - metadata must be loaded in context variables (use loadMetadata middleware first)
 *
 * Usage:
 * ```
 * pamphlet.get('/:id/tile/:hash',
 *   requireToken,
 *   loadMetadata,
 *   tileCache,
 *   async (c) => {
 *     // Handler returns response with cache headers
 *     const tile = await getTile(...);
 *     return new Response(tile.body, {
 *       headers: { 'Content-Type': 'image/webp', ...getTileCacheHeaders() }
 *     });
 *   }
 * );
 * ```
 */
export async function tileCache(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Function
) {
  const pamphletId = c.req.param('id');
  const hash = c.req.param('hash');
  const metadata = c.get('metadata');

  if (!pamphletId || !hash || !metadata) {
    // Skip cache if required data is missing
    await next();
    return;
  }

  // Generate cache key with version
  const cacheKey = getTileCacheKey(pamphletId, hash, metadata.version);

  // Check Cache API
  const cachedResponse = await getTileFromCache(cacheKey);
  if (cachedResponse) {
    console.log(`Cache HIT: ${cacheKey}`);
    return cachedResponse;
  }

  console.log(`Cache MISS: ${cacheKey}`);

  // Execute handler to get response
  await next();

  // After handler execution, cache the response if it's successful
  const response = c.res;
  if (response && response.status === 200) {
    // Store in cache asynchronously (non-blocking)
    c.executionCtx.waitUntil(putTileIntoCache(cacheKey, response.clone()));
  }
}
