/// <reference path="./wasm.d.ts" />

import type { WasmModule } from '../types';

let wasmModule: WasmModule | null = null;
let wasmInitPromise: Promise<WasmModule> | null = null;

export async function initWasm(): Promise<WasmModule> {
  if (wasmModule) return wasmModule;
  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = (async () => {
    try {
      // Dynamic import of WASM module
      // Type definitions are provided by wasm.d.ts but TypeScript cannot resolve
      // dynamic imports at compile time. Runtime type safety is ensured by WasmModule interface.
      // @ts-expect-error - Dynamic import path cannot be resolved at compile time
      const wasmImport = await import(/* @vite-ignore */ '/wasm/tile_wasm.js');
      await wasmImport.default();

      const wasm: WasmModule = {
        tile_image: wasmImport.tile_image,
        generate_metadata: wasmImport.generate_metadata,
        calculate_hash: wasmImport.calculate_hash,
      };

      wasmModule = wasm;
      return wasmModule;
    } catch (error) {
      console.error('WASM initialization failed:', error);
      throw error;
    }
  })();

  return wasmInitPromise;
}
