# WASM Tiling Engine

Rust/WASMベースの画像タイル化エンジン。ブラウザ上で画像をタイル分割し、WebP形式で出力します。

## 機能

- 🖼️ 画像のタイル分割（設定可能なタイルサイズ）
- 🗜️ WebPエンコード（品質制御可能）
- 🔐 SHA256ハッシュ計算（タイル命名・重複排除）
- 📊 metadata.json生成
- ⚡ 高速処理（512x512画像を約13msで処理）

## ビルド

```bash
npm run build          # Node.js用にビルド
npm run build:release  # リリースビルド（最適化）
```

## テスト

```bash
npm test          # 全テストを実行（ビルド + vitest）
npm run test:watch  # ウォッチモード
npm run test:ui     # Vitest UI
npm run test:cargo  # Cargoテストのみ
```

## テストスイート

### 機能テスト (wasm.test.js)

27個のテストで以下を検証：

- **Image Loading**: 画像ファイルの読み込み
- **Tiling Process**: タイル化処理（座標、ハッシュ生成）
- **WebP Encoding**: WebP形式への変換とRIFF/WEBP検証
- **Hash Calculation**: SHA256ハッシュの正確性と一貫性
- **Metadata Generation**: metadata.jsonの生成と構造
- **File Output**: ファイルへの保存
- **Edge Cases**: エラーハンドリング、境界値テスト

### パフォーマンステスト (performance.test.js)

17個のテストで以下を検証：

- **Tile Size Comparison**: 128px, 256px, 512pxでの性能比較
- **Scalability Tests**: 100回の連続処理でのパフォーマンス劣化チェック
- **Quality vs Speed**: 品質設定（60, 80, 95）による処理速度の違い
- **Parallel Processing**: 並行処理のシミュレーション
- **Memory Efficiency**: メモリリークチェック

## テスト結果

```
✓ wasm.test.js (27 tests) 352ms
✓ performance.test.js (17 tests) 2772ms

Test Files  2 passed (2)
     Tests  44 passed (44)
```

### パフォーマンスベンチマーク

| Tile Size | Tile Count | Avg Time | Output Size |
|-----------|------------|----------|-------------|
| 128px     | 16         | 15.38ms  | 94.3KB      |
| 256px     | 4          | 12.74ms  | 93.6KB      |
| 512px     | 1          | 12.42ms  | 91.6KB      |

- **処理速度**: 平均12-13ms（512x512画像）
- **メモリ効率**: 100回の連続処理でもパフォーマンス劣化なし
- **並行処理**: 5並列リクエストで65ms（平均13ms/リクエスト）

## 使用例

```javascript
import init, { tile_image, generate_metadata, calculate_hash } from './pkg/tile_wasm.js';

await init();

// 画像をタイル化
const imageData = new Uint8Array([...]); // 画像バイナリ
const result = tile_image(imageData, 256, 80); // タイルサイズ256px、品質80

console.log(`Tiles: ${result.tile_count()}`);

// タイルデータを取得
for (let i = 0; i < result.tile_count(); i++) {
  const tile = result.tiles[i];
  const tileData = result.get_tile_data(i);

  console.log(`Tile (${tile.x}, ${tile.y}): ${tile.hash}`);
  // tileData: Uint8Array (WebP形式)
}

// メタデータ生成
const pages = [{
  page: 0,
  width: result.width,
  height: result.height,
  tiles: result.tiles.map(t => ({ x: t.x, y: t.y, hash: t.hash }))
}];

const metadata = generate_metadata(JSON.stringify(pages), 256);
```

## API

### `tile_image(image_data, tile_size, quality?)`

画像をタイル化します。

- `image_data`: Uint8Array - 元画像のバイトデータ（JPEG/PNG等）
- `tile_size`: number - タイルサイズ（ピクセル）
- `quality`: number (optional) - WebP品質（1-100、デフォルト80）
- 戻り値: `JsTileResult`

### `generate_metadata(pages_json, tile_size)`

metadata.jsonを生成します。

- `pages_json`: string - ページ情報のJSON文字列
- `tile_size`: number - タイルサイズ
- 戻り値: string - metadata.json

### `calculate_hash(data)`

SHA256ハッシュを計算します。

- `data`: Uint8Array - ハッシュ化するデータ
- 戻り値: string - 64文字の16進数文字列

## 依存関係

- `wasm-bindgen`: JavaScriptバインディング
- `image`: 画像処理（PNG, JPEG, WebP対応）
- `sha2`: SHA256ハッシュ計算
- `serde`: シリアライゼーション

開発用:
- `vitest`: テストフレームワーク
- `@vitest/ui`: Vitest UI

## ライセンス

MIT
