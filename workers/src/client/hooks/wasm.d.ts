/**
 * WASM module type declarations
 */
declare module '/wasm/tile_wasm.js' {
  import type { JsTileResult } from 'shared/types/wasm';

  export default function init(): Promise<void>;
  export function tile_image(
    imageData: Uint8Array,
    tileSize: number,
    quality?: number
  ): JsTileResult;
  export function generate_metadata(pagesJson: string, tileSize: number): string;
  export function calculate_hash(data: Uint8Array): string;
}
