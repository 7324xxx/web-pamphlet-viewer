/**
 * WASM Tiling Engine Type Definitions
 */

/**
 * タイル情報
 */
export interface JsTileInfo {
  /** タイルのX座標（タイル単位） */
  x: number;
  /** タイルのY座標（タイル単位） */
  y: number;
  /** タイルのSHA256ハッシュ（64文字の16進数） */
  hash: string;
}

/**
 * タイル化結果
 */
export interface JsTileResult {
  /** 元画像の幅（ピクセル） */
  width: number;
  /** 元画像の高さ（ピクセル） */
  height: number;
  /** タイルサイズ（ピクセル） */
  tile_size: number;
  /** タイル情報の配列 */
  tiles: JsTileInfo[];
  /** タイル数を取得 */
  tile_count(): number;
  /** 指定インデックスのタイルデータ（WebP）を取得 */
  get_tile_data(index: number): Uint8Array;
}

/**
 * WASMモジュールインターフェース
 */
export interface WasmModule {
  /**
   * 画像をタイル化
   * @param imageData 元画像のバイトデータ（JPEG/PNG等）
   * @param tileSize タイルサイズ（ピクセル）
   * @param quality WebP品質（1-100、デフォルト80）
   * @returns タイル化結果
   */
  tile_image(imageData: Uint8Array, tileSize: number, quality?: number): JsTileResult;

  /**
   * metadata.jsonを生成
   * @param pagesJson ページ情報のJSON文字列
   * @param tileSize タイルサイズ
   * @returns metadata.jsonの文字列
   */
  generate_metadata(pagesJson: string, tileSize: number): string;

  /**
   * SHA256ハッシュを計算
   * @param data ハッシュ化するデータ
   * @returns SHA256ハッシュの16進数文字列（64文字）
   */
  calculate_hash(data: Uint8Array): string;
}
