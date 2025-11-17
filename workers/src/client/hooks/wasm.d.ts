/**
 * WASM module type declarations
 * This allows TypeScript to recognize dynamic imports of the WASM module
 */
declare module '/wasm/tile_wasm.js' {
  import type { JsTileResult } from '../types';

  function init(): Promise<void>;
  function tile_image(
    imageData: Uint8Array,
    tileSize: number,
    quality?: number
  ): JsTileResult;
  function generate_metadata(pagesJson: string, tileSize: number): string;
  function calculate_hash(data: Uint8Array): string;

  export { init as default, tile_image, generate_metadata, calculate_hash };
}
