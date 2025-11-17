/// <reference path="./wasm.d.ts" />

import type { WasmModule } from '../types';

let wasmModule: WasmModule | null = null;
let wasmInitPromise: Promise<WasmModule> | null = null;

export async function initWasm(): Promise<WasmModule> {
  if (wasmModule) return wasmModule;
  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = (async () => {
    try {
      // Dynamic import of WASM module - type checking is bypassed here
      // as the module path is resolved at runtime by Vite
      const wasmImport = await import('/wasm/tile_wasm.js' as string);
      await (wasmImport.default as () => Promise<void>)();

      const wasm: WasmModule = {
        tile_image: wasmImport.tile_image as WasmModule['tile_image'],
        generate_metadata: wasmImport.generate_metadata as WasmModule['generate_metadata'],
        calculate_hash: wasmImport.calculate_hash as WasmModule['calculate_hash'],
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
