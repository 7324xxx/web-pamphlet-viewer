/**
 * API Types for Hono Client
 * Manually defined to avoid importing from workers
 */

// Metadata response type
export interface MetadataResponse {
  version: string;
  tile_size: number;
  pages: Array<{
    page: number;
    width: number;
    height: number;
    tiles: Array<{
      x: number;
      y: number;
      hash: string;
    }>;
  }>;
  total_pages: number;
  has_more: boolean;
  has_previous: boolean;
}

// Client interface for type-safe API calls
export interface ApiClient {
  pamphlet: {
    [id: string]: {
      metadata: {
        $get: (args: {
          param: { id: string };
          query?: { pages?: string };
        }) => Promise<Response>;
      };
      tile: {
        [hash: string]: {
          $get: (args: {
            param: { id: string; hash: string };
          }) => Promise<Response>;
        };
      };
    };
  };
}
