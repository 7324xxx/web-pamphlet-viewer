import type { MetadataResponse } from '../types/api';

/**
 * Create a typed API client with helper methods
 */
export function createApiClient(baseUrl: string) {
  return {
    /**
     * Fetch metadata for a pamphlet
     */
    async fetchMetadata(
      id: string,
      pages?: string
    ): Promise<MetadataResponse> {
      const url = pages
        ? `${baseUrl}/pamphlet/${id}/metadata?pages=${pages}`
        : `${baseUrl}/pamphlet/${id}/metadata`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch metadata: ${res.statusText}`);
      }
      return res.json();
    },

    /**
     * Fetch a tile image
     */
    async fetchTile(id: string, hash: string): Promise<Blob> {
      const url = `${baseUrl}/pamphlet/${id}/tile/${hash}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch tile: ${res.statusText}`);
      }
      return res.blob();
    }
  };
}
