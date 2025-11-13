# Shared Types and Utilities

Workers、Frontend、WASMテストで共有される型定義とユーティリティ。

## 構成

```
shared/
├── src/
│   ├── index.ts              # メインエクスポート
│   └── types/
│       ├── index.ts          # 型定義エクスポート
│       ├── wasm.ts           # WASM型定義
│       └── metadata.ts       # metadata.json型定義
├── package.json              # パッケージ定義
└── tsconfig.json             # TypeScript設定
```

## 型定義

### WASM型 (wasm.ts)

```typescript
import type { WasmModule, JsTileResult, JsTileInfo } from 'shared/types/wasm';

// WASMモジュール
const wasm: WasmModule = await import('./pkg/tile_wasm.js');

// タイル化
const result: JsTileResult = wasm.tile_image(imageData, 256, 80);
```

### Metadata型 (metadata.ts)

```typescript
import type { Metadata, PageInfo, TileMetadata } from 'shared/types/metadata';

// メタデータ
const metadata: Metadata = {
  version: Date.now(),
  tile_size: 256,
  pages: [{
    page: 0,
    width: 512,
    height: 512,
    tiles: [{ x: 0, y: 0, hash: "abc123..." }]
  }]
};
```

## 使用方法

### インストール

pnpm workspaceで自動的にリンクされます。

```json
{
  "dependencies": {
    "shared": "workspace:*"
  }
}
```

### インポート

```typescript
// 全ての型をインポート
import type { WasmModule, Metadata } from 'shared';

// 特定の型のみインポート
import type { JsTileResult } from 'shared/types/wasm';
import type { PageInfo } from 'shared/types/metadata';
```

## 型定義一覧

### WASM型

- `WasmModule` - WASMモジュールインターフェース
- `JsTileResult` - タイル化結果
- `JsTileInfo` - タイル情報

### Metadata型

- `Metadata` - パンフレットメタデータ
- `PageInfo` - ページ情報
- `TileMetadata` - タイルメタデータ
- `MetadataResponse` - API: GET /pamphlet/:id/metadata
- `UploadRequest` - API: POST /upload (request)
- `UploadResponse` - API: POST /upload (response)

## メリット

- ✅ 型の一元管理
- ✅ Workers/Frontend/WASM間の型の一貫性
- ✅ 変更時の影響範囲が明確
- ✅ IntelliSense/自動補完サポート
- ✅ リファクタリングが安全
