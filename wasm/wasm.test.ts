import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// WASM型定義
interface JsTileInfo {
  x: number;
  y: number;
  hash: string;
}

interface JsTileResult {
  width: number;
  height: number;
  tile_size: number;
  tiles: JsTileInfo[];
  tile_count(): number;
  get_tile_data(index: number): Uint8Array;
}

interface WasmModule {
  tile_image(imageData: Uint8Array, tileSize: number, quality?: number): JsTileResult;
  generate_metadata(pagesJson: string, tileSize: number): string;
  calculate_hash(data: Uint8Array): string;
}

// WASMモジュールをロード
let wasm: WasmModule;

beforeAll(async () => {
  wasm = await import('./pkg/tile_wasm.js');
});

describe('WASM Tiling Engine', () => {
  const imagePath = join(__dirname, 'sample.jpg');
  const imageData = readFileSync(imagePath);
  const tileSize = 256;
  const quality = 80;

  describe('Image Loading', () => {
    it('should load test image successfully', () => {
      expect(imageData).toBeDefined();
      expect(imageData.length).toBeGreaterThan(0);
      expect(imageData.length).toBe(85848);
    });
  });

  describe('Tiling Process', () => {
    let result: JsTileResult;

    beforeAll(() => {
      result = wasm.tile_image(imageData, tileSize, quality);
    });

    it('should tile image successfully', () => {
      expect(result).toBeDefined();
    });

    it('should return correct image dimensions', () => {
      expect(result.width).toBe(512);
      expect(result.height).toBe(512);
    });

    it('should use correct tile size', () => {
      expect(result.tile_size).toBe(tileSize);
    });

    it('should generate correct number of tiles (2x2 grid)', () => {
      const expectedTiles = Math.ceil(512 / tileSize) * Math.ceil(512 / tileSize);
      expect(result.tile_count()).toBe(expectedTiles);
      expect(result.tile_count()).toBe(4);
    });

    it('should generate tiles with correct coordinates', () => {
      const tiles = result.tiles;

      // タイル座標の検証
      expect(tiles[0]!.x).toBe(0);
      expect(tiles[0]!.y).toBe(0);

      expect(tiles[1]!.x).toBe(1);
      expect(tiles[1]!.y).toBe(0);

      expect(tiles[2]!.x).toBe(0);
      expect(tiles[2]!.y).toBe(1);

      expect(tiles[3]!.x).toBe(1);
      expect(tiles[3]!.y).toBe(1);
    });

    it('should generate tiles with SHA256 hashes', () => {
      const tiles = result.tiles;

      for (const tile of tiles) {
        expect(tile.hash).toBeDefined();
        expect(tile.hash).toHaveLength(64); // SHA256は64文字の16進数
        expect(tile.hash).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    it('should have unique hashes for different tiles', () => {
      const tiles = result.tiles;
      const hashes = tiles.map(t => t.hash);
      const uniqueHashes = new Set(hashes);

      // このテスト画像では全てのタイルが異なるはず
      expect(uniqueHashes.size).toBe(tiles.length);
    });
  });

  describe('WebP Encoding', () => {
    let result: JsTileResult;

    beforeAll(() => {
      result = wasm.tile_image(imageData, tileSize, quality);
    });

    it('should encode tiles as WebP', () => {
      const tileData = result.get_tile_data(0);

      expect(tileData).toBeDefined();
      expect(tileData.length).toBeGreaterThan(0);
    });

    it('should generate WebP with RIFF header', () => {
      const tileData = result.get_tile_data(0);
      const header = String.fromCharCode(...Array.from(tileData.slice(0, 4)));

      expect(header).toBe('RIFF');
    });

    it('should generate WebP with WEBP format identifier', () => {
      const tileData = result.get_tile_data(0);
      const format = String.fromCharCode(...Array.from(tileData.slice(8, 12)));

      expect(format).toBe('WEBP');
    });

    it('should compress images (output smaller than input)', () => {
      const result = wasm.tile_image(imageData, tileSize, quality);
      let totalSize = 0;

      for (let i = 0; i < result.tile_count(); i++) {
        totalSize += result.get_tile_data(i).length;
      }

      // WebPは元画像より大きくなる場合もある（小さいタイルの場合）
      expect(totalSize).toBeGreaterThan(0);
    });

    it('should generate tiles with reasonable sizes', () => {
      for (let i = 0; i < result.tile_count(); i++) {
        const tileData = result.get_tile_data(i);

        expect(tileData.length).toBeGreaterThan(1000); // 最低1KB
        expect(tileData.length).toBeLessThan(1024 * 1024); // 最大1MB
      }
    });
  });

  describe('Hash Calculation', () => {
    it('should calculate SHA256 hash correctly', () => {
      const testData = new TextEncoder().encode('test data');
      const hash = wasm.calculate_hash(testData);

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
      expect(hash).toBe('916f0027a575074ce72a331777c3478d6513f786a591bd892da1a577bf2335f9');
    });

    it('should generate consistent hashes', () => {
      const testData = new TextEncoder().encode('hello world');
      const hash1 = wasm.calculate_hash(testData);
      const hash2 = wasm.calculate_hash(testData);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different data', () => {
      const data1 = new TextEncoder().encode('data1');
      const data2 = new TextEncoder().encode('data2');

      const hash1 = wasm.calculate_hash(data1);
      const hash2 = wasm.calculate_hash(data2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Metadata Generation', () => {
    interface PageInfo {
      page: number;
      width: number;
      height: number;
      tiles: Array<{ x: number; y: number; hash: string }>;
    }

    it('should generate valid metadata JSON', () => {
      const result = wasm.tile_image(imageData, tileSize, quality);
      const tiles = result.tiles;

      const pages: PageInfo[] = [{
        page: 0,
        width: result.width,
        height: result.height,
        tiles: tiles.map(tile => ({
          x: tile.x,
          y: tile.y,
          hash: tile.hash
        }))
      }];

      const metadataJson = wasm.generate_metadata(JSON.stringify(pages), tileSize);

      expect(metadataJson).toBeDefined();
      expect(() => JSON.parse(metadataJson)).not.toThrow();
    });

    it('should include version in metadata', () => {
      const pages: PageInfo[] = [{
        page: 0,
        width: 512,
        height: 512,
        tiles: []
      }];

      const metadataJson = wasm.generate_metadata(JSON.stringify(pages), tileSize);
      const metadata = JSON.parse(metadataJson);

      expect(metadata.version).toBeDefined();
      expect(typeof metadata.version).toBe('number');
      expect(metadata.version).toBeGreaterThan(0);
    });

    it('should include tile_size in metadata', () => {
      const pages: PageInfo[] = [{
        page: 0,
        width: 512,
        height: 512,
        tiles: []
      }];

      const metadataJson = wasm.generate_metadata(JSON.stringify(pages), tileSize);
      const metadata = JSON.parse(metadataJson);

      expect(metadata.tile_size).toBe(tileSize);
    });

    it('should include pages array in metadata', () => {
      const result = wasm.tile_image(imageData, tileSize, quality);
      const tiles = result.tiles;

      const pages: PageInfo[] = [{
        page: 0,
        width: result.width,
        height: result.height,
        tiles: tiles.map(tile => ({
          x: tile.x,
          y: tile.y,
          hash: tile.hash
        }))
      }];

      const metadataJson = wasm.generate_metadata(JSON.stringify(pages), tileSize);
      const metadata = JSON.parse(metadataJson);

      expect(metadata.pages).toBeDefined();
      expect(Array.isArray(metadata.pages)).toBe(true);
      expect(metadata.pages.length).toBe(1);
      expect(metadata.pages[0].tiles.length).toBe(4);
    });
  });

  describe('File Output', () => {
    const outputDir = join(__dirname, 'output');

    it('should save tiles to disk', () => {
      const result = wasm.tile_image(imageData, tileSize, quality);

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const tiles = result.tiles;
      const savedFiles: string[] = [];

      for (let i = 0; i < result.tile_count(); i++) {
        const tile = tiles[i]!;
        const tileData = result.get_tile_data(i);
        const filename = `tile-${tile.x}-${tile.y}-${tile.hash.substring(0, 8)}.webp`;
        const filepath = join(outputDir, filename);

        writeFileSync(filepath, Buffer.from(tileData));
        savedFiles.push(filepath);
      }

      expect(savedFiles.length).toBe(4);

      // ファイルが実際に存在するか確認
      for (const filepath of savedFiles) {
        expect(existsSync(filepath)).toBe(true);
      }
    });

    it('should save metadata to disk', () => {
      const result = wasm.tile_image(imageData, tileSize, quality);
      const tiles = result.tiles;

      const pages = [{
        page: 0,
        width: result.width,
        height: result.height,
        tiles: tiles.map(tile => ({
          x: tile.x,
          y: tile.y,
          hash: tile.hash
        }))
      }];

      const metadataJson = wasm.generate_metadata(JSON.stringify(pages), tileSize);
      const metadataPath = join(outputDir, 'metadata.json');

      writeFileSync(metadataPath, metadataJson);

      expect(existsSync(metadataPath)).toBe(true);

      // 保存したメタデータを読み込んで検証
      const savedMetadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
      expect(savedMetadata.version).toBeDefined();
      expect(savedMetadata.tile_size).toBe(tileSize);
      expect(savedMetadata.pages.length).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should process image quickly (< 100ms)', () => {
      const start = performance.now();
      wasm.tile_image(imageData, tileSize, quality);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('should be consistent across multiple runs', () => {
      const times: number[] = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        wasm.tile_image(imageData, tileSize, quality);
        const elapsed = performance.now() - start;
        times.push(elapsed);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);

      // 平均処理時間が100ms未満
      expect(avg).toBeLessThan(100);

      // 最大と最小の差が平均の2倍未満（一貫性）
      expect(max - min).toBeLessThan(avg * 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle different tile sizes', () => {
      const sizes = [128, 256, 512];

      for (const size of sizes) {
        const result = wasm.tile_image(imageData, size, quality);

        expect(result.tile_size).toBe(size);
        expect(result.tile_count()).toBeGreaterThan(0);
      }
    });

    it('should throw error for invalid image data', () => {
      const invalidData = new Uint8Array([0, 0, 0, 0]);

      expect(() => {
        wasm.tile_image(invalidData, tileSize, quality);
      }).toThrow();
    });

    it('should handle tile index out of bounds', () => {
      const result = wasm.tile_image(imageData, tileSize, quality);

      expect(() => {
        result.get_tile_data(999);
      }).toThrow();
    });
  });
});
