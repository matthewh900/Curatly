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

export interface ArtworkFilter {
  medium?: string;
  department?: string;
  culture?: string;
  artist?: string;
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
  limit = 10
): Promise<Artwork[]> {
  const limitedIds = ids.slice(0, limit);

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
  return artworks.filter((art) => {
    const { medium, department, culture, artist } = filters;

    const matchesMedium = medium
      ? art.medium?.toLowerCase().includes(medium.toLowerCase())
      : true;
    const matchesDepartment = department
      ? art.department?.toLowerCase() === department.toLowerCase()
      : true;
    const matchesCulture = culture
      ? art.culture?.toLowerCase().includes(culture.toLowerCase())
      : true;
    const matchesArtist = artist
      ? art.artistDisplayName?.toLowerCase().includes(artist.toLowerCase())
      : true;

    return (
      matchesMedium && matchesDepartment && matchesCulture && matchesArtist
    );
  });
}

// search for artwork IDs using a query string
export async function searchArtworks(
  query?: string,
  departmentId?: number
): Promise<number[]> {
  const encodedQuery = encodeURIComponent(query?.trim() || "*");

  let url = `${BASE_URL}/search?q=${encodedQuery}&hasImages=true`;

  if (departmentId !== undefined) {
    url += `&departmentId=${departmentId}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to search artworks with query: "${query}"`);
  }

  const data = (await res.json()) as {
    total: number;
    objectIDs: number[] | null;
  };

  return data.objectIDs ? data.objectIDs.slice(0, 100) : [];
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
