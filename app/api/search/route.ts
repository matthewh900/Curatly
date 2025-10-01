// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { searchArtworks } from '@/lib/api/met';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  try {
    const objectIDs = await searchArtworks(query);
    return NextResponse.json({ objectIDs });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to search artworks' },
      { status: 500 }
    );
  }
}
