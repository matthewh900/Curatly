// favourites page should fetch items that have been favourited by specific logged in user, should redirect to login page if no logged in user
// will have the option to add favourited item to users exhibition or remove from favourites
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { FavouritedArtwork } from "@/lib/types/favouritedArtwork";
import ArtworkCard from "@/lib/components/artworkCard";
import AddToExhibitionButton from "@/lib/components/addToExhibitionsButton";

export default function FavouritesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<FavouritedArtwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndFavourites = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("favourites")
        .select(
          "id, object_id, title, artist, image_url, artwork_url, provider"
        )
        .eq("user_id", user.id);

      if (!error && data) {
        const artworks: FavouritedArtwork[] = data.map((fav) => ({
          id: fav.object_id,
          provider: fav.provider,
          title: fav.title,
          artist: fav.artist,
          imageUrl: fav.image_url,
          artworkUrl: fav.artwork_url,
          date: "", // Not stored
          description: "", // Not stored
          favouriteId: fav.id,
        }));

        setFavourites(artworks);
      }

      setLoading(false);
    };

    fetchUserAndFavourites();
  }, [router]);

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading favourites...</p>;
  }

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ textAlign: "center" }}>My Favourites</h1>

      {favourites.length === 0 ? (
        <p style={{ textAlign: "center" }}>
          You have no favourite artworks yet.
        </p>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 15,
          }}
        >
          {favourites.map((art) => (
            <ArtworkCard key={art.id} artwork={art} userId={userId}>
              {userId && (
                <AddToExhibitionButton
                  favouriteId={art.favouriteId}
                  userId={userId}
                />
              )}
            </ArtworkCard>
          ))}
        </section>
      )}
    </main>
  );
}
