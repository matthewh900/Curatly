// app > api > artworks > route.ts
import { NextResponse } from "next/server";
import {
  searchArtworks as searchMetArtworks,
  getArtworksByIds as getMetArtworksByIds,
  mapMetToUnified,
} from "@/lib/api/met";
import {
  searchArtworks as searchAICArtworks,
  mapAICToUnified,
} from "@/lib/api/artic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const query = url.searchParams.get("query") || "art";
    const departmentId = url.searchParams.get("departmentId");
    let page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const provider = url.searchParams.get("provider") || "met";

    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid page or limit parameter" },
        { status: 400 }
      );
    }

    let artworks = [];
    let total = 0;
    let totalPages = 0;

    if (provider === "met") {
      const ids = await searchMetArtworks(
        query,
        departmentId ? Number(departmentId) : undefined
      );
    
      const validIds = Array.isArray(ids) ? ids : [];
      total = validIds.length;
      totalPages = total > 0 ? Math.ceil(total / limit) : 0;
      page = totalPages > 0 ? Math.min(page, totalPages) : 1;
    
      const startIndex = (page - 1) * limit;
    
      // Attempt to get up to `limit` valid artworks
      const validArtworks: ReturnType<typeof mapMetToUnified>[] = [];
      let attempts = 0;
      let index = startIndex;
    
      while (validArtworks.length < limit && index < validIds.length && attempts < limit * 3) {
        const chunk = validIds.slice(index, index + 5);
        const chunkArtworks = await getMetArtworksByIds(chunk);
        const unified = chunkArtworks.map(mapMetToUnified);
        validArtworks.push(...unified);
    
        index += 5;
        attempts++;
      }
    
      artworks = validArtworks.slice(0, limit);
    
      console.log(
        `Met artworks search query="${query}", department=${departmentId}, page=${page}/${totalPages}, results=${artworks.length}`
      );    
    } else if (provider === "aic") {
      // Search AIC API with pagination
      const aicResponse = await searchAICArtworks(query, page, limit);
      total = aicResponse.pagination.total;
      totalPages = aicResponse.pagination.total_pages;

      if (page > totalPages && totalPages > 0) {
        return NextResponse.json(
          { error: "Page number out of range" },
          { status: 400 }
        );
      }

      // Map AIC artworks to unified type using iiif_url from config
      artworks = aicResponse.data.map((a) =>
        mapAICToUnified(a, aicResponse.config.iiif_url)
      );

    } else {
      return NextResponse.json(
        { error: "Invalid provider specified" },
        { status: 400 }
      );
    }

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
