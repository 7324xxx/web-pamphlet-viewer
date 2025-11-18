import type { Tile } from '../types/metadata';

/**
 * viewport内の可視タイル座標を計算
 */
export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Canvas要素からviewportの境界を計算
 */
export function calculateViewportBounds(
  canvas: HTMLCanvasElement,
  tileSize: number,
  scale = 1
): ViewportBounds {
  const rect = canvas.getBoundingClientRect();

  // 表示領域全体を含むタイル範囲を計算
  const minX = Math.floor(0 / tileSize);
  const maxX = Math.ceil((rect.width / scale) / tileSize);
  const minY = Math.floor(0 / tileSize);
  const maxY = Math.ceil((rect.height / scale) / tileSize);

  return { minX, maxX, minY, maxY };
}

/**
 * viewport内のタイルをフィルタリング
 */
export function getVisibleTiles(
  tiles: Tile[],
  bounds: ViewportBounds
): Tile[] {
  return tiles.filter(
    tile =>
      tile.x >= bounds.minX &&
      tile.x < bounds.maxX &&
      tile.y >= bounds.minY &&
      tile.y < bounds.maxY
  );
}

/**
 * viewport外のタイル（プリフェッチ用）
 */
export function getPrefetchTiles(
  tiles: Tile[],
  bounds: ViewportBounds
): Tile[] {
  // viewport外のタイルを返す（優先度は低い）
  return tiles.filter(
    tile =>
      tile.x < bounds.minX ||
      tile.x >= bounds.maxX ||
      tile.y < bounds.minY ||
      tile.y >= bounds.maxY
  );
}
