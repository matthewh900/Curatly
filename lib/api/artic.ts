import { UnifiedArtwork } from "../types/unifiedArtwork";

const BASE_URL = "https://api.artic.edu/api/v1";

export interface AICArtwork {
  id: number;
  title: string;
  artist_display?: string | null;
  date_display?: string | null;
  image_id?: string | null;
}

export interface AICSearchResponse {
  data: Partial<AICArtwork>[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
  config: {
    iiif_url: string;
    website_url: string;
  };
}

// Build image URL
export function buildAICImageUrl(
  iiifUrl: string,
  imageId: string,
  width = 843
): string {
  return `${iiifUrl}/${imageId}/full/${width},/0/default.jpg`;
}

// Fetch one artwork by ID
export async function fetchArtworkById(id: number): Promise<AICArtwork | null> {
  const url = `${BASE_URL}/artworks/${id}?fields=id,title,artist_display,date_display,image_id`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Failed to fetch AIC artwork id ${id}, status ${res.status}`);
    return null;
  }
  const json = await res.json();
  return json.data as AICArtwork;
}

// Search artworks by query
export async function searchArtworks(
  query: string,
  page = 1,
  limit = 10
): Promise<AICSearchResponse> {
  const url = `${BASE_URL}/artworks/search?q=${encodeURIComponent(
    query
  )}&page=${page}&limit=${limit}&fields=id,title,artist_display,date_display,image_id`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`AIC search failed with status ${res.status}`);
  }
  const json = await res.json();
  return json as AICSearchResponse;
}

// Updated mapper that handles partial AICArtwork objects and returns null if required fields are missing
export function mapAICToUnified(
  a: Partial<AICArtwork>,
  iiif_url: string
): UnifiedArtwork | null {
  if (typeof a.id !== "number" || typeof a.title !== "string") {
    return null;
  }

  const artist =
    typeof a.artist_display === "string" ? a.artist_display : "Unknown";
  const date = typeof a.date_display === "string" ? a.date_display : "";
  const imageUrl = a.image_id ? buildAICImageUrl(iiif_url, a.image_id) : "";

  return {
    id: `aic-${a.id}`,
    provider: "aic",
    title: a.title,
    artist,
    date,
    imageUrl,
    artworkUrl: `https://www.artic.edu/artworks/${a.id}`,
    description: "",
  };
}
