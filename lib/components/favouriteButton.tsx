'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Artwork } from '../api/met';

type FavouriteButtonProps = {
  artwork: Artwork;
  userId: string | null;
};

export default function FavouriteButton({ artwork, userId }: FavouriteButtonProps) {
  const [isFavourited, setIsFavourited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const checkFavourite = async () => {
      const { data, error } = await supabase
        .from('favourites')
        .select('id')
        .eq('user_id', userId)
        .eq('object_id', artwork.objectID)
        .maybeSingle();

      if (data) setIsFavourited(true);
    };
    checkFavourite();
  }, [userId, artwork.objectID]);

  const handleToggleFavourite = async () => {
    if (!userId) {
      alert('Please log in to favourite artworks.');
      return;
    }

    setLoading(true);

    if (isFavourited) {
      // Optional: allow unfavouriting
      const { error } = await supabase
        .from('favourites')
        .delete()
        .eq('user_id', userId)
        .eq('object_id', artwork.objectID);

      if (!error) setIsFavourited(false);
    } else {
      const { error } = await supabase.from('favourites').insert({
        user_id: userId,
        object_id: artwork.objectID,
        title: artwork.title,
        artist: artwork.artistDisplayName,
        image_url: artwork.primaryImageSmall,
        object_url: artwork.objectURL,
      });

      if (!error) setIsFavourited(true);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleToggleFavourite}
      disabled={loading}
      aria-label={isFavourited ? 'Unfavourite' : 'Favourite'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 20,
        marginTop: 8,
        color: isFavourited ? 'red' : '#aaa',
        transition: 'color 0.2s',
      }}
    >
      {isFavourited ? '♥︎' : '♡'}
    </button>
  );
}
