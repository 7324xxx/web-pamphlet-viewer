import { hc } from 'hono/client';
import type { AppType } from '../../index';
import type { ProcessedPage, Metadata } from '../types';

export async function uploadTiles(
  pages: ProcessedPage[],
  pamphletId: string,
  tileSize: number,
  onProgress: (progress: number) => void
): Promise<{ id: string; version: number }> {
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

  // タイルを追加（ハッシュベース、重複排除）
  const tiles: Record<string, Blob> = {};
  const addedHashes = new Set<string>();

  for (const page of pages) {
    for (const tile of page.tiles) {
      if (!addedHashes.has(tile.hash)) {
        tiles[`tile-${tile.hash}`] = new Blob([tile.data as Uint8Array<ArrayBuffer>], { type: 'image/webp' });
        addedHashes.add(tile.hash);
      }
    }
  }

  // アップロード (Hono RPC client with type-safe form data)
  // Note: hc<AppType>('/') returns a complex union type that TypeScript
  // cannot always infer correctly. We use type assertion here as the
  // actual runtime behavior is correct.
  const res = await (hc<AppType>('/') as {
    admin: {
      upload: {
        $post: (args: {
          form: Record<string, string | Blob>;
        }) => Promise<Response>;
      };
    };
  }).admin.upload.$post({
    form: {
      id: pamphletId,
      metadata: JSON.stringify(metadata),
      ...tiles,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload failed: ${res.status} ${errorText}`);
  }

  const result = (await res.json()) as { id: string; version: number };
  onProgress(100);

  return result;
}
