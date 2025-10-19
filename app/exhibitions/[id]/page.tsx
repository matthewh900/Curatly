import { notFound } from "next/navigation";
import ExhibitionEditor from "@/lib/components/exhibitionEditor";
import { supabaseServer } from "@/lib/supabaseServerClient";
import styles from "@/lib/styles/exhibitionPage.module.css"

export interface ExhibitionArtwork {
  id: string;
  provider: "met" | "aic";
  title: string;
  artist: string;
  image_url: string;
  artwork_url: string;
}

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

  // Fetch related favourites for this exhibition
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

  let artworks: ExhibitionArtwork[] = [];

  if (favouriteIds.length > 0) {
    const { data: favourites, error: favouritesDetailsError } =
      await supabaseServer
        .from("favourites")
        .select("id, provider, title, artist, image_url, artwork_url")
        .in("id", favouriteIds);

    if (favouritesDetailsError) {
      console.error("Failed to load artworks:", favouritesDetailsError.message);
    } else if (favourites) {
      artworks = favourites.map((f) => ({
        id: String(f.id),
        provider: f.provider as "met" | "aic",
        title: f.title || "Untitled",
        artist: f.artist || "Unknown Artist",
        image_url: f.image_url || "",
        artwork_url: f.artwork_url || "",
      }));
    }
  }

  return (
    <main className={styles.main}>
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
