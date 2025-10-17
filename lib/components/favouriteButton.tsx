"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UnifiedArtwork } from "@/lib/types/unifiedArtwork";

type FavouriteButtonProps = {
  artwork: UnifiedArtwork;
  userId: string | null;
};

export default function FavouriteButton({ artwork, userId }: FavouriteButtonProps) {
  const [isFavourited, setIsFavourited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const checkFavourite = async () => {
      const { data, error } = await supabase
        .from("favourites")
        .select("id")
        .eq("user_id", userId)
        .eq("object_id", artwork.id)
        .maybeSingle();

      if (data) setIsFavourited(true);
    };

    checkFavourite();
  }, [userId, artwork.id]);

  const handleToggleFavourite = async () => {
    if (!userId) {
      alert("Please log in to favourite artworks.");
      return;
    }

    setLoading(true);

    if (isFavourited) {
      // Remove from favourites
      const { error } = await supabase
        .from("favourites")
        .delete()
        .eq("user_id", userId)
        .eq("object_id", artwork.id);

      if (!error) setIsFavourited(false);
    } else {
      // Add to favourites
      const { error } = await supabase.from("favourites").insert({
        user_id: userId,
        object_id: artwork.id, // e.g. "met-123" or "aic-456"
        provider: artwork.provider,
        title: artwork.title,
        artist: artwork.artist,
        image_url: artwork.imageUrl,
        artwork_url: artwork.artworkUrl,
      });

      if (!error) setIsFavourited(true);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleToggleFavourite}
      disabled={loading}
      aria-label={isFavourited ? "Unfavourite" : "Favourite"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 20,
        marginTop: 8,
        color: isFavourited ? "red" : "#aaa",
        transition: "color 0.2s",
      }}
    >
      {isFavourited ? "♥︎" : "♡"}
    </button>
  );
}
