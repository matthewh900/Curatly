export interface UnifiedArtwork {
  id: string;           // e.g. "met-12345" or "aic-54321"
  provider: "met" | "aic";
  title: string;
  artist: string;
  date: string;
  imageUrl: string;
  description?: string;
  artworkUrl: string;
}

