import { hc } from 'hono/client';
import type { AppType } from '../../index';
import type { ProcessedPage } from '../types';

interface UploadMetadata {
  version: string;
  tile_size: number;
  pages: Array<{
    page: number;
    width: number;
    height: number;
    tiles: Array<{
      x: number;
      y: number;
      hash: string;
    }>;
  }>;
}

// Create Hono RPC client
const client = hc<AppType>('/');

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
  const metadata: UploadMetadata = {
    version: Date.now().toString(),
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
        tiles[`tile-${tile.hash}`] = new Blob([tile.data], { type: 'image/webp' });
        addedHashes.add(tile.hash);
      }
    }
  }

  // アップロード (Hono RPC client with type-safe form data)
  const res = await client.admin.upload.$post({
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

  const result = await res.json();
  onProgress(100);

  return result;
}
