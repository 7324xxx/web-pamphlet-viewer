import { hc } from 'hono/client';
import type { AppType } from '../../index';
import { uploadResponseSchema } from '../../routes/upload';
import type { ProcessedPage, Metadata } from '../types';
import type { z } from 'zod';

export async function uploadTiles(
  pages: ProcessedPage[],
  pamphletId: string,
  tileSize: number,
  onProgress: (progress: number) => void
): Promise<z.infer<typeof uploadResponseSchema>> {
  if (pages.length === 0) {
    throw new Error('アップロード可能なページがありません');
  }

  onProgress(0);

  // メタデータを構築
  const metadata: Metadata = {
    version: Date.now(),
    tile_size: tileSize,
    pages: pages.map((page) => ({
      page: page.pageNumber,
      width: page.width,
      height: page.height,
      tiles: page.tiles.map((tile) => ({
        x: tile.x,
        y: tile.y,
        hash: tile.hash,
      })),
    })),
  };

  // FormDataを構築（ハッシュベース、重複排除）
  const formData = new FormData();
  formData.append('id', pamphletId);
  formData.append('metadata', JSON.stringify(metadata));

  const addedHashes = new Set<string>();
  for (const page of pages) {
    for (const tile of page.tiles) {
      if (!addedHashes.has(tile.hash)) {
        // Create new Uint8Array from the data to ensure ArrayBuffer type
        const dataArray = new Uint8Array(tile.data);
        const blob = new Blob([dataArray], { type: 'image/webp' });
        formData.append(`tile-${tile.hash}`, blob);
        addedHashes.add(tile.hash);
      }
    }
  }

  // アップロード (Hono RPC client with FormData)
  // Note: TypeScript cannot infer the type of hc<AppType>() due to complex route types from app.route()
  // Runtime type safety is ensured by zod schema validation below
  const client = hc<AppType>('/');

  // Type-safe accessor with runtime validation
  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  function getEndpoint(obj: unknown, path: string[]): unknown {
    let current = obj;
    for (const key of path) {
      if (!isRecord(current) || !(key in current)) {
        throw new Error(`Invalid client structure: missing ${path.join('.')}`);
      }
      current = current[key];
    }
    return current;
  }

  const $post = getEndpoint(client, ['admin', 'upload', '$post']);
  if (typeof $post !== 'function') {
    throw new Error('Invalid client structure: $post is not a function');
  }

  const res = await $post({
    form: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload failed: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  const result = uploadResponseSchema.parse(json);
  onProgress(100);

  return result;
}
