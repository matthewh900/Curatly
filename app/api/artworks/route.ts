import { NextResponse } from "next/server";
import { searchArtworks, getArtworksByIds } from "@/lib/api/met";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    // Query parameters
    const query = url.searchParams.get("query") || "art";
    const departmentId = url.searchParams.get("departmentId");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid page or limit parameter" },
        { status: 400 }
      );
    }

    // Get all matching artwork IDs
    const objectIDs = await searchArtworks(
      query,
      departmentId ? Number(departmentId) : undefined
    );

    // No results found
    if (!objectIDs || objectIDs.length === 0) {
      return NextResponse.json({
        artworks: [],
        total: 0,
        page,
        totalPages: 0,
      });
    }

    const total = objectIDs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // If page is out of range, return empty list
    if (startIndex >= total) {
      return NextResponse.json({
        artworks: [],
        total,
        page,
        totalPages,
      });
    }

    // Paginate IDs
    const paginatedIDs = objectIDs.slice(startIndex, endIndex);

    // Fetch the artworks
    const artworks = await getArtworksByIds(paginatedIDs);

    return NextResponse.json({
      artworks,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Error in /api/artworks route:", error);
    return NextResponse.json(
      { error: "Failed to fetch artworks" },
      { status: 500 }
    );
  }
}

