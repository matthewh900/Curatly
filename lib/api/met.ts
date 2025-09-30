// this file contains all the api functions that I need to fetch data from the met museum of art api

const BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1";

export interface Artwork {
  objectID: number;
  title: string;
  artistDisplayName: string;
  artistDisplayBio: string;
  objectDate: string;
  medium: string;
  department: string;
  culture: string;
  primaryImage: string; // Full-size image URL
  primaryImageSmall: string; // Thumbnail/smaller image URL
  additionalImages: string[]; // Other images URLs
  objectURL: string; // Link to Met Museum page
  creditLine: string; // Credit info (e.g. gift, purchase)
  dimensions: string;
  classification: string;
  repository: string;
}

// get singular artwork by given id
export async function getArtworkById(id: number): Promise<Artwork> {
  const res = await fetch(`${BASE_URL}/objects/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch artwork with ID: ${id}`);
  const Artwork = (await res.json()) as Artwork;
  return Artwork;
}

// get multiple artworks by given array of numbers
export async function getArtworksByIds(ids: number[], limit=10): Promise<Artwork[]> {
    const limitedIds = ids.slice(0, limit)
    const promises = limitedIds.map((id) => getArtworkById(id))
    return Promise.all(promises)
}