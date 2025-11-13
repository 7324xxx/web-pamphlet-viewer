/**
 * Pamphlet Metadata Type Definitions
 */

/**
 * タイルのメタデータ
 */
export interface TileMetadata {
  /** タイルのX座標（タイル単位） */
  x: number;
  /** タイルのY座標（タイル単位） */
  y: number;
  /** タイルのSHA256ハッシュ */
  hash: string;
}

/**
 * ページ情報
 */
export interface PageInfo {
  /** ページ番号（0始まり） */
  page: number;
  /** ページの幅（ピクセル） */
  width: number;
  /** ページの高さ（ピクセル） */
  height: number;
  /** ページ内のタイル配列 */
  tiles: TileMetadata[];
}

/**
 * パンフレットのメタデータ
 */
export interface Metadata {
  /** バージョン（タイムスタンプまたはシーケンシャル番号） */
  version: number;
  /** タイルサイズ（ピクセル） */
  tile_size: number;
  /** ページ配列 */
  pages: PageInfo[];
}

/**
 * API: GET /pamphlet/:id/metadata のレスポンス
 */
export type MetadataResponse = Metadata;

/**
 * API: POST /upload のリクエストボディ
 */
export interface UploadRequest {
  /** パンフレットID */
  id: string;
  /** ページ情報 */
  pages: PageInfo[];
  /** タイルサイズ */
  tile_size: number;
}

/**
 * API: POST /upload のレスポンス
 */
export interface UploadResponse {
  /** パンフレットID */
  id: string;
  /** バージョン番号 */
  version: number;
  /** ステータス */
  status: 'ok' | 'error';
  /** エラーメッセージ（エラー時） */
  message?: string;
}
