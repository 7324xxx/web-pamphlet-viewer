/**
 * Metadata Middleware
 * Loads pamphlet metadata and stores in context variables
 */

import { Context } from 'hono';
import type { Env, Variables } from '../types/bindings';
import type { Metadata } from 'shared/types/wasm';
import * as r2Service from '../services/r2';

/**
 * Load metadata middleware
 * Fetches metadata from R2 and stores in context variables
 *
 * Prerequisites:
 * - pamphletId must be in route params as 'id'
 *
 * Sets context variable:
 * - c.set('metadata', metadata)
 *
 * Returns 404 if pamphlet not found
 */
export async function loadMetadata(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Function
) {
  const pamphletId = c.req.param('id');

  if (!pamphletId) {
    return c.json({ error: 'Missing pamphlet ID' }, 400);
  }

  try {
    // Get metadata from R2
    const metadata = (await r2Service.getMetadata(c.env, pamphletId)) as Metadata | null;

    if (!metadata) {
      return c.json({ error: 'Pamphlet not found' }, 404);
    }

    // Store metadata in context variables for downstream handlers
    c.set('metadata', metadata);

    // Continue to next handler
    await next();
  } catch (error) {
    console.error('Error loading metadata:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}
