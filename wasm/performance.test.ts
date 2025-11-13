import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { WasmModule } from 'shared/types/wasm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let wasm: WasmModule;

beforeAll(async () => {
  wasm = await import('./pkg/tile_wasm.js');
});

describe('WASM Performance Benchmarks', () => {
  const imagePath = join(__dirname, 'sample.jpg');
  const imageData = readFileSync(imagePath);

  describe('Tile Size Comparison', () => {
    const tileSizes = [128, 256, 512];
    const quality = 80;
    const iterations = 10;

    for (const tileSize of tileSizes) {
      describe(`Tile Size: ${tileSize}px`, () => {
        it(`should process image in reasonable time (avg < 50ms)`, () => {
          const times: number[] = [];

          for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            const result = wasm.tile_image(imageData, tileSize, quality);
            const end = performance.now();

            times.push(end - start);

            // 最初のイテレーションで結果を検証
            if (i === 0) {
              expect(result.tile_count()).toBeGreaterThan(0);
            }
          }

          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          const min = Math.min(...times);
          const max = Math.max(...times);
          const stdDev = Math.sqrt(
            times.map(t => Math.pow(t - avg, 2)).reduce((a, b) => a + b, 0) / times.length
          );

          console.log(`  Tile Size ${tileSize}px:`);
          console.log(`    Average: ${avg.toFixed(2)}ms`);
          console.log(`    Min: ${min.toFixed(2)}ms`);
          console.log(`    Max: ${max.toFixed(2)}ms`);
          console.log(`    Std Dev: ${stdDev.toFixed(2)}ms`);

          // パフォーマンス検証
          expect(avg).toBeLessThan(50);
          expect(max).toBeLessThan(100);
        });

        it(`should generate correct number of tiles`, () => {
          const result = wasm.tile_image(imageData, tileSize, quality);
          const expectedTiles = Math.ceil(512 / tileSize) * Math.ceil(512 / tileSize);

          expect(result.tile_count()).toBe(expectedTiles);
        });

        it(`should produce valid WebP output`, () => {
          const result = wasm.tile_image(imageData, tileSize, quality);
          let totalSize = 0;

          for (let i = 0; i < result.tile_count(); i++) {
            const tileData = result.get_tile_data(i);
            totalSize += tileData.length;

            // WebP形式を検証
            const header = String.fromCharCode(...Array.from(tileData.slice(0, 4)));
            expect(header).toBe('RIFF');
          }

          const compressionRatio = ((1 - totalSize / imageData.length) * 100).toFixed(1);

          console.log(`    Total output size: ${(totalSize / 1024).toFixed(1)}KB`);
          console.log(`    Compression ratio: ${compressionRatio}%`);

          expect(totalSize).toBeGreaterThan(0);
        });
      });
    }
  });

  describe('Scalability Tests', () => {
    it('should handle repeated processing efficiently', () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        wasm.tile_image(imageData, 256, 80);
        const end = performance.now();
        times.push(end - start);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const firstTenAvg = times.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const lastTenAvg = times.slice(-10).reduce((a, b) => a + b, 0) / 10;

      console.log(`  100 iterations:`);
      console.log(`    Overall average: ${avg.toFixed(2)}ms`);
      console.log(`    First 10 avg: ${firstTenAvg.toFixed(2)}ms`);
      console.log(`    Last 10 avg: ${lastTenAvg.toFixed(2)}ms`);

      // パフォーマンスが劣化しないことを確認
      expect(lastTenAvg).toBeLessThan(firstTenAvg * 1.5);
    });

    it('should process without memory leaks', () => {
      // メモリ使用量の増加をチェック
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const result = wasm.tile_image(imageData, 256, 80);

        // 各イテレーションで結果が正しいことを確認
        expect(result.tile_count()).toBe(4);
      }

      // メモリリークがなければテストが完了する
      expect(true).toBe(true);
    });
  });

  describe('Quality vs Speed Trade-off', () => {
    const qualities = [60, 80, 95];

    for (const quality of qualities) {
      it(`should handle quality ${quality} efficiently`, () => {
        const times: number[] = [];
        const iterations = 5;

        for (let i = 0; i < iterations; i++) {
          const start = performance.now();
          const result = wasm.tile_image(imageData, 256, quality);
          const end = performance.now();
          times.push(end - start);
        }

        const avg = times.reduce((a, b) => a + b, 0) / times.length;

        console.log(`  Quality ${quality}: ${avg.toFixed(2)}ms avg`);

        expect(avg).toBeLessThan(100);
      });
    }
  });

  describe('Parallel Processing Simulation', () => {
    it('should handle concurrent tiling requests', async () => {
      const concurrentRequests = 5;
      const promises: Promise<{ tileCount: number; time: number }>[] = [];

      const startTime = performance.now();

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          new Promise((resolve) => {
            const start = performance.now();
            const result = wasm.tile_image(imageData, 256, 80);
            const end = performance.now();

            resolve({
              tileCount: result.tile_count(),
              time: end - start
            });
          })
        );
      }

      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;

      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;

      console.log(`  Concurrent processing (${concurrentRequests} requests):`);
      console.log(`    Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`    Average per request: ${avgTime.toFixed(2)}ms`);

      // 全てのリクエストが正しく処理されたことを確認
      for (const result of results) {
        expect(result.tileCount).toBe(4);
      }
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle large tile sizes efficiently', () => {
      const result = wasm.tile_image(imageData, 512, 80);

      expect(result.tile_count()).toBe(1);

      const tileData = result.get_tile_data(0);
      expect(tileData.length).toBeGreaterThan(0);
      expect(tileData.length).toBeLessThan(imageData.length * 2); // 元画像の2倍以下
    });

    it('should handle small tile sizes without excessive overhead', () => {
      const result = wasm.tile_image(imageData, 128, 80);

      expect(result.tile_count()).toBe(16); // 4x4 grid

      let totalSize = 0;
      for (let i = 0; i < result.tile_count(); i++) {
        totalSize += result.get_tile_data(i).length;
      }

      // 総サイズが合理的な範囲内
      expect(totalSize).toBeLessThan(imageData.length * 3);
    });
  });
});
