import type { Tile } from '../types/metadata';

/**
 * タイル読み込みタスク
 */
interface TileLoadTask {
  tile: Tile;
  priority: number;
  url: string;
}

/**
 * タイルローダー - 並列数制御付きタイル取得
 */
export class TileLoader {
  private queue: TileLoadTask[] = [];
  private running = 0;
  private maxConcurrent: number;
  private cache = new Map<string, HTMLImageElement>();
  private loading = new Set<string>();

  constructor(maxConcurrent = 6) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * タイルを読み込み
   */
  async loadTile(
    tile: Tile,
    apiBase: string,
    pamphletId: string,
    priority = 0
  ): Promise<HTMLImageElement> {
    const url = `${apiBase}/pamphlet/${pamphletId}/tile/${tile.hash}`;

    // キャッシュチェック
    const cached = this.cache.get(url);
    if (cached) {
      return cached;
    }

    // 既に読み込み中の場合は待つ
    if (this.loading.has(url)) {
      return this.waitForLoad(url);
    }

    // キューに追加
    return new Promise((resolve, reject) => {
      this.queue.push({
        tile,
        priority,
        url
      });

      // 優先度でソート（高い方が先）
      this.queue.sort((a, b) => b.priority - a.priority);

      this.processQueue().then(() => {
        const img = this.cache.get(url);
        if (img) {
          resolve(img);
        } else {
          reject(new Error(`Failed to load tile: ${url}`));
        }
      });
    });
  }

  /**
   * 複数のタイルを読み込み
   */
  async loadTiles(
    tiles: Tile[],
    apiBase: string,
    pamphletId: string,
    priority = 0
  ): Promise<Map<string, HTMLImageElement>> {
    const results = new Map<string, HTMLImageElement>();

    await Promise.all(
      tiles.map(async tile => {
        try {
          const img = await this.loadTile(tile, apiBase, pamphletId, priority);
          const key = `${tile.x},${tile.y}`;
          results.set(key, img);
        } catch (err) {
          console.error(`Failed to load tile ${tile.x},${tile.y}:`, err);
        }
      })
    );

    return results;
  }

  /**
   * キューを処理
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const task = this.queue.shift();
      if (!task) break;

      this.running++;
      this.loading.add(task.url);

      try {
        const img = await this.fetchImage(task.url);
        this.cache.set(task.url, img);
      } catch (err) {
        console.error(`Failed to fetch ${task.url}:`, err);
      } finally {
        this.loading.delete(task.url);
        this.running--;
      }
    }

    // まだキューが残っている場合は続行
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      await this.processQueue();
    }
  }

  /**
   * 画像を取得
   */
  private async fetchImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

      img.src = url;
    });
  }

  /**
   * 読み込み完了を待つ
   */
  private async waitForLoad(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const check = () => {
        const img = this.cache.get(url);
        if (img) {
          resolve(img);
        } else if (this.loading.has(url)) {
          setTimeout(check, 50);
        } else {
          reject(new Error(`Tile not found: ${url}`));
        }
      };
      check();
    });
  }

  /**
   * キャッシュクリア
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 統計情報
   */
  getStats() {
    return {
      cached: this.cache.size,
      loading: this.loading.size,
      queued: this.queue.length
    };
  }
}
