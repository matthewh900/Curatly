// this file contains all the api functions that I need to fetch data from the met museum of art api

import { UnifiedArtwork } from "../types/unifiedArtwork";

const BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1";

export interface Artwork {
  objectID: number;
  title: string;
  artistDisplayName: string;
  artistDisplayBio?: string;
  objectDate?: string;
  medium?: string;
  department: string;
  culture?: string;
  primaryImage?: string; // Full-size image URL
  primaryImageSmall: string; // Thumbnail/smaller image URL
  additionalImages?: string[]; // Other images URLs
  objectURL: string; // Link to Met Museum page
  creditLine?: string; // Credit info (e.g. gift, purchase)
  dimensions?: string;
  classification?: string;
  repository?: string;
}

export interface ArtworkFilter {
  department?: string;
}

export interface Department {
  departmentId: number;
  displayName: string;
}

// get singular artwork by given id
export async function getArtworkById(id: number): Promise<Artwork | null> {
  const res = await fetch(`${BASE_URL}/objects/${id}`);

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    console.warn(
      `Failed to fetch artwork with ID: ${id} (status: ${res.status})`
    );
    return null;
  }

  const artwork = (await res.json()) as Artwork;
  return artwork;
}

// get multiple artworks by given array of numbers
export async function getArtworksByIds(
  ids: number[],
  limit?: number // make limit optional, but use when provided
): Promise<Artwork[]> {
  const limitedIds = typeof limit === "number" ? ids.slice(0, limit) : ids;

  const results = await Promise.allSettled(
    limitedIds.map((id) => getArtworkById(id))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<Artwork | null> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value as Artwork);
}

// filter artworks
export function filterArtworks(
  artworks: Artwork[],
  filters: ArtworkFilter
): Artwork[] {
  const { department } = filters;

  return artworks.filter((art) => {
    const matchesDepartment = department
      ? art.department?.toLowerCase() === department.toLowerCase()
      : true;

    return matchesDepartment;
  });
}

// search for artwork IDs using a query string
export async function searchArtworks(
  query?: string,
  departmentId?: number,
  retries = 3,
  backoff = 500
): Promise<number[]> {
  const encodedQuery = encodeURIComponent(query?.trim() || "*");
  let url = `${BASE_URL}/search?q=${encodedQuery}&hasImages=true`;

  if (departmentId !== undefined) {
    url += `&departmentId=${departmentId}`;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url);

    if (res.ok) {
      const data = (await res.json()) as {
        total: number;
        objectIDs: number[] | null;
      };
      return Array.isArray(data.objectIDs) ? data.objectIDs : [];
    } else if (res.status === 403 && attempt < retries) {
      // Wait exponentially longer before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, backoff * 2 ** attempt)
      );
      continue;
    } else {
      console.warn(`Search failed with status ${res.status}: ${url}`);
      return [];
    }
  }

  return [];
}

// fetch departments
export async function getDepartments(): Promise<Department[]> {
  const res = await fetch(`${BASE_URL}/departments`);
  if (!res.ok) {
    console.warn("Failed to fetch departments:", res.status);
    return [];
  }
  const data = (await res.json()) as { departments: Department[] };
  return data.departments;
}

// map an artwork to a unified type interface
export function mapMetToUnified(art: Artwork): UnifiedArtwork {
  return {
    id: `met-${art.objectID}`,
    provider: "met",
    title: art.title,
    artist: art.artistDisplayName || "Unknown Artist",
    date: art.objectDate || "",
    imageUrl: art.primaryImageSmall || "",
    description: art.medium || "",
    artworkUrl: art.objectURL,
  };
}
