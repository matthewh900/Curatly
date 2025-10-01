import { NextResponse } from 'next/server';
import { getArtworksByIds } from '@/lib/api/met';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const idsParam = url.searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Missing required "ids" query parameter' },
        { status: 400 }
      );
    }

    // Parse ids string into an array of numbers
    const ids = idsParam
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'No valid IDs provided' },
        { status: 400 }
      );
    }

    // Fetch artworks using your existing function
    const artworks = await getArtworksByIds(ids);

    return NextResponse.json(artworks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch artworks' },
      { status: 500 }
    );
  }
}
