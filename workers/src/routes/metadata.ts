/**
 * Metadata Router
 * Routes under /pamphlet
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types/bindings';
import * as kvService from '../services/kv';
import { getMetadataCacheHeaders } from '../services/cache';

const metadata = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /:id/metadata
 * Get pamphlet metadata
 */
metadata.get('/:id/metadata', async (c) => {
  const pamphletId = c.req.param('id');

  if (!pamphletId) {
    return c.json({ error: 'Missing pamphlet ID' }, 400);
  }

  try {
    // Get metadata from KV
    const metadataData = await kvService.getMetadata(c.env, pamphletId);

    if (!metadataData) {
      return c.json({ error: 'Pamphlet not found' }, 404);
    }

    // Return metadata with cache headers
    const headers = getMetadataCacheHeaders();
    return c.json(metadataData, 200, headers as Record<string, string>);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default metadata;
