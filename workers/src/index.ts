/**
 * Pamphlet Viewer Workers API
 * Built with Hono framework
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env, Variables } from './types/bindings';

// Import routers
import metadata from './routes/metadata';
import tile from './routes/tile';
import upload from './routes/upload';
import invalidate from './routes/invalidate';

// Create Hono app with type definitions
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*', // TODO: Restrict in production
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    service: 'Pamphlet Viewer API',
    status: 'ok',
    version: '1.0.0',
  });
});

// Mount routers
app.route('/pamphlet', metadata);
app.route('/pamphlet', tile);
app.route('/pamphlet', invalidate);
app.route('/', upload);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: 'Internal server error',
      message: err.message,
    },
    500
  );
});

// Export the app
export default app;
