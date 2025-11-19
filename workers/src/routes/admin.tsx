import { Hono } from 'hono';
import type { Metadata } from 'shared/types/wasm';
import { Script, ViteClient } from 'vite-ssr-components/hono';
import { loadMetadata } from '../middleware/metadata';
import { deleteFromCache } from '../services/cache';
import * as r2Service from '../services/r2';
import type { Env, Variables } from '../types/bindings';
import upload from './upload';

const admin = new Hono<{ Bindings: Env; Variables: Variables }>()
	.get('/', (c) => {
		return c.html(
			<html lang="ja">
				<head>
					<meta charset="UTF-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<title>パンフレットアップローダー</title>
					<Script type="module" src="/src/client/index.tsx" />
					<ViteClient />
				</head>
				<body>
					<div id="root"></div>
				</body>
			</html>
		);
	})
	.route('/upload', upload)
	/**
	 * DELETE /admin/delete/:id
	 * Delete pamphlet data (R2) and metadata cache
	 *
	 * Note: Tile caches are NOT deleted to avoid subrequest limits.
	 * They will expire naturally after 30 days (TTL), and since R2 data
	 * is deleted, any cache hits will fail to serve content.
	 */
	.delete('/delete/:id', loadMetadata, async (c) => {
		const pamphletId = c.req.param('id');

		if (!pamphletId) {
			return c.json({ error: 'Missing pamphlet ID' }, 400);
		}

		try {
			// 1. Delete all R2 objects (metadata + tiles)
			// This is the most important step - removes actual data
			// Uses R2 deleteMultiple() to efficiently delete up to 1000 objects per call
			const r2ObjectsDeleted = await r2Service.deletePamphlet(c.env, pamphletId);

			// 2. Delete metadata cache
			// This prevents clients from discovering tile URLs
			const metadataUrl = new URL(c.req.url);
			metadataUrl.pathname = `/pamphlet/${pamphletId}/metadata`;
			const metadataCacheDeleted = await deleteFromCache(metadataUrl.toString());

			// Note: Tile caches are NOT deleted due to Cloudflare Workers subrequest limits (50/request)
			// - Large pamphlets can have hundreds of unique tiles
			// - Tile caches will expire after 30 days (s-maxage=2592000)
			// - Since R2 data is deleted, cached tiles cannot be re-validated
			// - Metadata cache deletion prevents new clients from finding tile URLs

			return c.json({
				id: pamphletId,
				status: 'ok',
				message: 'Pamphlet deleted successfully (tile caches will expire in 30 days)',
				deleted: {
					r2Objects: r2ObjectsDeleted,
					metadataCache: metadataCacheDeleted,
					tileCaches: 'skipped (will expire via TTL)',
				},
			});
		} catch (error) {
			console.error('Error deleting pamphlet:', error);
			return c.json({ error: 'Internal server error', message: String(error) }, 500);
		}
	});

export default admin;
