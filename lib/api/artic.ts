const BASE_URL = "https://api.artic.edu/api/v1";

export interface Artwork {
  id: number;
  title: string;
  artist_title: string | null;
  date_display: string | null;
  image_id: string | null;
  // Add more fields as needed
}

export interface PaginatedArtworks {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

// Fetch artworks with pagination (page number, limit per page)
export async function fetchArtworks(page = 1, limit = 10): Promise<PaginatedArtworks> {
  const url = `${BASE_URL}/artworks?page=${page}&limit=${limit}&fields=id,title,artist_title,date_display,image_id`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch artworks");
  return res.json();
}

// Fetch a single artwork by ID
export async function fetchArtworkById(id: number): Promise<Artwork> {
  const url = `${BASE_URL}/artworks/${id}?fields=id,title,artist_title,date_display,image_id`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch artwork with id ${id}`);
  const json = await res.json();
  return json.data;
}

// Search artworks by query text
export async function searchArtworks(query: string, page = 1, limit = 10): Promise<PaginatedArtworks> {
  const url = `${BASE_URL}/artworks/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}&fields=id,title,artist_title,date_display,image_id`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to search artworks");
  return res.json();
}

// Helper to get full image URL from image_id
export function getArtworkImageUrl(imageId: string, width = 843): string {
  return `https://www.artic.edu/iiif/2/${imageId}/full/${width},/0/default.jpg`;
}
