'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Artwork } from '../api/met';

type FavoriteButtonProps = {
  artwork: Artwork;
  userId: string | null;
};

export default function FavoriteButton({ artwork, userId }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const checkFavorite = async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('object_id', artwork.objectID)
        .maybeSingle();

      if (data) setIsFavorited(true);
    };
    checkFavorite();
  }, [userId, artwork.objectID]);

  const handleToggleFavorite = async () => {
    if (!userId) {
      alert('Please log in to favorite artworks.');
      return;
    }

    setLoading(true);

    if (isFavorited) {
      // Optional: allow unfavoriting
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('object_id', artwork.objectID);

      if (!error) setIsFavorited(false);
    } else {
      const { error } = await supabase.from('favorites').insert({
        user_id: userId,
        object_id: artwork.objectID,
        title: artwork.title,
        artist: artwork.artistDisplayName,
        image_url: artwork.primaryImageSmall,
        object_url: artwork.objectURL,
      });

      if (!error) setIsFavorited(true);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={loading}
      aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 20,
        marginTop: 8,
        color: isFavorited ? 'red' : '#aaa',
        transition: 'color 0.2s',
      }}
    >
      {isFavorited ? '♥︎' : '♡'}
    </button>
  );
}
