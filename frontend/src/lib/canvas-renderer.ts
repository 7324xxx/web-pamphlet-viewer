import type { Tile } from '../types/metadata';

/**
 * Canvas描画管理
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tileSize: number;
  private scale = 1;
  private dpr: number;

  constructor(canvas: HTMLCanvasElement, tileSize: number) {
    this.canvas = canvas;
    this.tileSize = tileSize;
    this.dpr = window.devicePixelRatio || 1;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
  }

  /**
   * Canvasを初期化（ページサイズに合わせる）
   */
  initCanvas(width: number, height: number): void {
    // 高DPI対応
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // スケール調整
    this.ctx.scale(this.dpr, this.dpr);

    // 背景をクリア
    this.clear();
  }

  /**
   * Canvasをクリア
   */
  clear(): void {
    this.ctx.fillStyle = '#f9fafb';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * タイルを描画
   */
  drawTile(tile: Tile, img: HTMLImageElement): void {
    const x = tile.x * this.tileSize;
    const y = tile.y * this.tileSize;

    try {
      this.ctx.drawImage(
        img,
        x * this.scale,
        y * this.scale,
        this.tileSize * this.scale,
        this.tileSize * this.scale
      );
    } catch (err) {
      console.error(`Failed to draw tile at ${tile.x},${tile.y}:`, err);
    }
  }

  /**
   * 複数のタイルを描画
   */
  drawTiles(tiles: Map<string, { tile: Tile; img: HTMLImageElement }>): void {
    requestAnimationFrame(() => {
      tiles.forEach(({ tile, img }) => {
        this.drawTile(tile, img);
      });
    });
  }

  /**
   * プレースホルダー（読み込み中のタイル）を描画
   */
  drawPlaceholder(tile: Tile): void {
    const x = tile.x * this.tileSize;
    const y = tile.y * this.tileSize;

    this.ctx.fillStyle = '#e5e7eb';
    this.ctx.fillRect(
      x * this.scale,
      y * this.scale,
      this.tileSize * this.scale,
      this.tileSize * this.scale
    );

    // 枠線
    this.ctx.strokeStyle = '#d1d5db';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      x * this.scale,
      y * this.scale,
      this.tileSize * this.scale,
      this.tileSize * this.scale
    );
  }

  /**
   * ズーム設定
   */
  setScale(scale: number): void {
    this.scale = scale;
  }

  /**
   * Canvas要素を取得
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * コンテキストを取得
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
