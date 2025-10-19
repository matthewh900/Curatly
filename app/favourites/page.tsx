"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { FavouritedArtwork } from "@/lib/types/favouritedArtwork";
import ArtworkCard from "@/lib/components/artworkCard";
import AddToExhibitionButton from "@/lib/components/addToExhibitionsButton";
import styles from "@/lib/styles/favouritesPage.module.css"

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
    <main className={styles.main}>
      <h1 className={styles.title}>My Favourites</h1>

      {favourites.length === 0 ? (
        <p className={styles.centerText}>
          You have no favourite artworks yet.
        </p>
      ) : (
        <section className={styles.grid}>
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
