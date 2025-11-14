/**
 * Invalidate Router
 * Routes under /pamphlet
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/bindings';
import * as kvService from '../services/kv';
import * as r2Service from '../services/r2';

const invalidate = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * POST /:id/invalidate
 * Invalidate pamphlet cache by updating version
 */
invalidate.post('/:id/invalidate', async (c) => {
  const pamphletId = c.req.param('id');

  if (!pamphletId) {
    return c.json({ error: 'Missing pamphlet ID' }, 400);
  }

  try {
    // Update version in KV (this will invalidate cache)
    const newVersion = await kvService.updateMetadataVersion(c.env, pamphletId);

    // Also update metadata in R2
    const metadata = await kvService.getMetadata(c.env, pamphletId);
    if (metadata) {
      await r2Service.putMetadata(c.env, pamphletId, metadata);
    }

    return c.json({
      id: pamphletId,
      version: newVersion,
      status: 'ok',
      message: 'Cache invalidated successfully',
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return c.json({ error: 'Internal server error', message: String(error) }, 500);
  }
});

export default invalidate;
