export interface DocumentResponse {
  name: string;
  metadata: {
    source_type: string;
    source_url: string;
  };
  summary: string;
}
