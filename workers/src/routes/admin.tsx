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
	 * Delete pamphlet data (R2) and caches
	 */
	.get('/delete/:id', loadMetadata, async (c) => {
		const pamphletId = c.req.param('id');

		if (!pamphletId) {
			return c.json({ error: 'Missing pamphlet ID' }, 400);
		}

		try {
			// 1. Get metadata from context (loaded by middleware)
			const metadata = c.get('metadata') as Metadata;

			// 2. Collect all unique tile hashes for cache deletion
			const tileHashes = new Set<string>();
			for (const page of metadata.pages) {
				for (const tile of page.tiles) {
					tileHashes.add(tile.hash);
				}
			}

			// 3. Delete all R2 objects (metadata + tiles)
			await r2Service.deletePamphlet(c.env, pamphletId);

			// 4. Delete metadata cache
			const metadataUrl = new URL(c.req.url);
			metadataUrl.pathname = `/pamphlet/${pamphletId}/metadata`;
			const metadataCacheDeleted = await deleteFromCache(metadataUrl.toString());

			// 5. Delete tile caches in parallel
			const deleteCachePromises = Array.from(tileHashes).map(async (hash) => {
				const tileUrl = new URL(c.req.url);
				tileUrl.pathname = `/pamphlet/${pamphletId}/tile/${hash}`;
				const deleted = await deleteFromCache(tileUrl.toString());
				return deleted ? 1 : 0;
			});

			const results = await Promise.all(deleteCachePromises);
			const tileCachesDeleted = results.reduce<number>((sum, count) => sum + count, 0);

			return c.json({
				id: pamphletId,
				status: 'ok',
				message: 'Pamphlet deleted successfully',
				deleted: {
					r2: true,
					metadataCache: metadataCacheDeleted,
					tileCaches: tileCachesDeleted,
					totalCaches: metadataCacheDeleted ? tileCachesDeleted + 1 : tileCachesDeleted,
				},
			});
		} catch (error) {
			console.error('Error deleting pamphlet:', error);
			return c.json({ error: 'Internal server error', message: String(error) }, 500);
		}
	});

export default admin;
