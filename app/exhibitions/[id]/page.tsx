// exhibition page will show data from the items chosen by the userAgent, for expandNextJsTemplate, images, bio, date discovered/created, etc
// maybe allow users to be creative with exhibitions by putting items in different section, organising by date/location etc
// /app/exhibitions/[id]/page.tsx
import { notFound } from "next/navigation";
import ExhibitionEditor from "@/lib/components/exhibitionEditor";
import { supabaseServer } from "@/lib/supabaseServerClient";

export interface ExhibitionArtwork {
  id: string;
  title: string;
  artist: string;
  image_url: string;
  object_url: string;
}

// Correct `params` usage
export default async function ExhibitionPage(context: {
  params: Promise<{ id: string }>;
}) {
  const { id: exhibitionId } = await context.params;

  // Fetch exhibition data
  const { data: exhibition, error: exhibitionError } = await supabaseServer
    .from("exhibitions")
    .select("id, user_id, name, description")
    .eq("id", exhibitionId)
    .single();

  if (exhibitionError || !exhibition) {
    console.error("Exhibition not found:", exhibitionError?.message);
    return notFound();
  }

  // Fetch related favourites
  const { data: exhibitionFavourites, error: favouritesError } =
    await supabaseServer
      .from("exhibition_favourites")
      .select("favourite_id")
      .eq("exhibition_id", exhibition.id);

  if (favouritesError) {
    console.error("Failed to load exhibition favourites:", favouritesError.message);
    return notFound();
  }

  const favouriteIds = exhibitionFavourites?.map((f) => f.favourite_id) ?? [];

  // Fetch favourite details
  let artworks: ExhibitionArtwork[] = [];

  if (favouriteIds.length > 0) {
    const { data: favourites, error: favouritesDetailsError } =
      await supabaseServer
        .from("favourites")
        .select("id, title, artist, image_url, object_url")
        .in("id", favouriteIds);

    if (favouritesDetailsError) {
      console.error("Failed to load artworks:", favouritesDetailsError.message);
    } else if (favourites) {
      artworks = favourites.map((f) => ({
        id: String(f.id),
        title: f.title || "Untitled",
        artist: f.artist || "Unknown Artist",
        image_url: f.image_url || "",
        object_url: f.object_url || "",
      }));
    }
  }

  return (
    <main style={styles.main}>
      <ExhibitionEditor
        exhibition={{
          id: exhibition.id,
          name: exhibition.name,
          description: exhibition.description,
        }}
        artworks={artworks}
      />
    </main>
  );
}

// Styles
const styles = {
  main: {
    maxWidth: "960px",
    margin: "2rem auto",
    padding: "1rem",
  },
};
