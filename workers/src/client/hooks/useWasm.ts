/// <reference path="./wasm.d.ts" />

import type { WasmModule } from '../types';

let wasmModule: WasmModule | null = null;
let wasmInitPromise: Promise<WasmModule> | null = null;

/**
 * Type guard to check if a value is a Record
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard to check if an object is a valid WASM module
 */
function isWasmModule(obj: unknown): obj is WasmModule {
  if (!isRecord(obj)) return false;
  return (
    typeof obj.tile_image === 'function' &&
    typeof obj.generate_metadata === 'function' &&
    typeof obj.calculate_hash === 'function'
  );
}

export async function initWasm(): Promise<WasmModule> {
  if (wasmModule) return wasmModule;
  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = (async () => {
    try {
      // Dynamic import of WASM module
      // Runtime type safety is ensured by type guards below
      const wasmImport: unknown = await import(/* @vite-ignore */ '/wasm/tile_wasm.js');

      // Validate that wasmImport is a record with default function
      if (!isRecord(wasmImport) || !('default' in wasmImport)) {
        throw new Error('Invalid WASM module: missing default export');
      }

      const defaultExport = wasmImport.default;
      if (typeof defaultExport !== 'function') {
        throw new Error('Invalid WASM module: default export is not a function');
      }

      // Call the init function
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const result = defaultExport();

      // Validate that the result is a Promise
      if (!(result instanceof Promise)) {
        throw new Error('Invalid WASM module: default export does not return a Promise');
      }

      await result;

      // Validate that wasmImport matches WasmModule interface
      if (!isWasmModule(wasmImport)) {
        throw new Error('Invalid WASM module: missing required methods');
      }

      wasmModule = wasmImport;
      return wasmModule;
    } catch (error) {
      console.error('WASM initialization failed:', error);
      throw error;
    }
  })();

  return wasmInitPromise;
}
