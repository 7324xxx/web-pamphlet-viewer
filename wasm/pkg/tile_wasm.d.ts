/* tslint:disable */
/* eslint-disable */
/**
 * SHA256ハッシュを計算（JavaScriptから呼び出し可能）
 *
 * # Arguments
 * * `data` - ハッシュ化するバイトデータ
 *
 * # Returns
 * SHA256ハッシュの16進数文字列
 */
export function calculate_hash(data: Uint8Array): string;
/**
 * 画像をタイル化する（JavaScriptから呼び出し可能）
 *
 * # Arguments
 * * `image_data` - 元画像のバイトデータ（JPEG/PNG等）
 * * `tile_size` - タイルサイズ（ピクセル、例: 512）
 * * `quality` - WebP品質（1-100、省略時80）
 *
 * # Returns
 * タイル化結果（JsTileResult）
 *
 * # Example (JavaScript)
 * ```js
 * import init, { tile_image } from './pkg/tile_wasm.js';
 *
 * await init();
 *
 * const imageData = new Uint8Array([...]); // 画像ファイルのバイナリ
 * const result = tile_image(imageData, 512, 80);
 *
 * console.log(`Width: ${result.width}, Height: ${result.height}`);
 * console.log(`Tile count: ${result.tile_count()}`);
 *
 * for (let i = 0; i < result.tile_count(); i++) {
 *   const tileData = result.get_tile_data(i);
 *   // tileData: Uint8Array (WebP形式)
 * }
 * ```
 */
export function tile_image(image_data: Uint8Array, tile_size: number, quality?: number | null): JsTileResult;
/**
 * WASMモジュール初期化時に呼ばれる
 * パニックフックを設定してエラーログを改善
 */
export function init(): void;
/**
 * metadata.jsonを生成する（JavaScriptから呼び出し可能）
 *
 * # Arguments
 * * `pages_json` - ページ情報のJSON文字列
 * * `tile_size` - タイルサイズ
 *
 * # Returns
 * metadata.jsonの文字列
 *
 * # Example (JavaScript)
 * ```js
 * const pages = [
 *   {
 *     page: 0,
 *     width: 2480,
 *     height: 3508,
 *     tiles: [
 *       { x: 0, y: 0, hash: "abc123..." },
 *       { x: 1, y: 0, hash: "def456..." },
 *     ]
 *   }
 * ];
 *
 * const metadata = generate_metadata(JSON.stringify(pages), 512);
 * console.log(metadata);
 * ```
 */
export function generate_metadata(pages_json: string, tile_size: number): string;
/**
 * JavaScriptに返すタイル情報
 */
export class JsTileInfo {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  readonly x: number;
  readonly y: number;
  readonly hash: string;
}
/**
 * JavaScriptに返すタイル化結果
 */
export class JsTileResult {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * タイル数を取得
   */
  tile_count(): number;
  /**
   * 指定したインデックスのタイルデータを取得
   */
  get_tile_data(index: number): Uint8Array;
  /**
   * タイル情報の配列を取得
   */
  readonly tiles: Array<any>;
  readonly width: number;
  readonly height: number;
  readonly tile_size: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_jstileinfo_free: (a: number, b: number) => void;
  readonly __wbg_jstileresult_free: (a: number, b: number) => void;
  readonly calculate_hash: (a: number, b: number) => [number, number];
  readonly generate_metadata: (a: number, b: number, c: number) => [number, number, number, number];
  readonly init: () => void;
  readonly jstileinfo_hash: (a: number) => [number, number];
  readonly jstileinfo_x: (a: number) => number;
  readonly jstileinfo_y: (a: number) => number;
  readonly jstileresult_get_tile_data: (a: number, b: number) => [number, number, number];
  readonly jstileresult_height: (a: number) => number;
  readonly jstileresult_tile_count: (a: number) => number;
  readonly jstileresult_tile_size: (a: number) => number;
  readonly jstileresult_tiles: (a: number) => any;
  readonly jstileresult_width: (a: number) => number;
  readonly tile_image: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
