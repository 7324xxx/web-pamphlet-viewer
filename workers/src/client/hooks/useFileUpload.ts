import type { ProcessedPage, UploadResponse } from '../types';

/**
 * Upload tiles in chunks to avoid payload size limits
 * Strategy: Upload tiles in batches, then finalize with metadata
 */
export async function uploadTiles(
	pages: ProcessedPage[],
	pamphletId: string,
	tileSize: number,
	onProgress: (progress: number) => void
): Promise<UploadResponse> {
	if (pages.length === 0) {
		throw new Error('アップロード可能なページがありません');
	}

	onProgress(0);

	// メタデータを構築（versionはサーバー側で設定される）
	const metadata = {
		tile_size: tileSize,
		pages: pages.map((page) => ({
			page: page.pageNumber,
			width: page.width,
			height: page.height,
			tiles: page.tiles.map((tile) => ({
				x: tile.x,
				y: tile.y,
				hash: tile.hash,
			})),
		})),
	};

	// Collect unique tiles (deduplication)
	const uniqueTiles = new Map<string, Uint8Array>();
	for (const page of pages) {
		for (const tile of page.tiles) {
			if (!uniqueTiles.has(tile.hash)) {
				uniqueTiles.set(tile.hash, tile.data);
			}
		}
	}

	const totalTiles = uniqueTiles.size;
	const CHUNK_SIZE = 100; // Upload 100 tiles per request
	const tiles = Array.from(uniqueTiles.entries());
	let uploadedTiles = 0;

	// Upload tiles in chunks
	for (let i = 0; i < tiles.length; i += CHUNK_SIZE) {
		const chunk = tiles.slice(i, i + CHUNK_SIZE);
		const formData = new FormData();
		formData.append('id', pamphletId);

		// Add tiles to FormData
		for (const [hash, data] of chunk) {
			const blob = new Blob([data.buffer as ArrayBuffer], { type: 'image/webp' });
			formData.append(`tile-${hash}`, blob);
		}

		// Upload chunk
		const res = await fetch('/admin/upload/tiles', {
			method: 'POST',
			body: formData,
		});

		if (!res.ok) {
			const errorText = await res.text();
			throw new Error(`Tile upload failed: ${res.status} ${errorText}`);
		}

		uploadedTiles += chunk.length;
		const progress = Math.floor((uploadedTiles / totalTiles) * 90); // Reserve 10% for metadata
		onProgress(progress);
	}

	// Finalize upload with metadata
	const completeRes = await fetch('/admin/upload/complete', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			id: pamphletId,
			metadata,
		}),
	});

	if (!completeRes.ok) {
		const errorText = await completeRes.text();
		throw new Error(`Upload completion failed: ${completeRes.status} ${errorText}`);
	}

	const result = (await completeRes.json()) as UploadResponse;
	onProgress(100);

	return result;
}
