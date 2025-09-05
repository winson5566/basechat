export interface DocumentResponse {
  name: string;
  metadata: {
    source_type: string;
    source_url: string;
    _source_updated_at?: number; // Unix timestamp
  };
  updatedAt: string; // ISO string
  summary: string;
}
