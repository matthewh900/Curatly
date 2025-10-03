// favourites page should fetch items that have been favourited by specific logged in user, should redirect to login page if no logged in user
// may need to find a way to store certain data so don't have to make as many api calls
// will have the option to add favourited item to users exhibition or remove from favourites
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Artwork } from '@/lib/api/met';
import FavoriteButton from '@/lib/components/favouriteButton';

export default function FavoritesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndFavorites = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.replace('/login');
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('favorites')
        .select('object_id, title, artist, image_url, object_url')
        .eq('user_id', user.id);

      if (!error && data) {
        const artworks: Artwork[] = data.map((fav) => ({
          objectID: fav.object_id,
          title: fav.title,
          artistDisplayName: fav.artist,
          primaryImageSmall: fav.image_url,
          objectURL: fav.object_url,
          department: ''
        }));

        setFavorites(artworks);
      }

      setLoading(false);
    };

    fetchUserAndFavorites();
  }, [router]);

  if (loading) {
    return <p style={{ textAlign: 'center' }}>Loading favorites...</p>;
  }

  return (
    <main style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ textAlign: 'center' }}>My Favorites</h1>

      {favorites.length === 0 ? (
        <p style={{ textAlign: 'center' }}>You have no favorite artworks yet.</p>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 15,
          }}
        >
          {favorites.map((art) => (
            <article
              key={art.objectID}
              style={{
                border: '1px solid #ddd',
                borderRadius: 4,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {art.primaryImageSmall ? (
                <img
                  src={art.primaryImageSmall}
                  alt={art.title}
                  style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 4 }}
                  loading="lazy"
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 140,
                    backgroundColor: '#eee',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                  }}
                >
                  No Image
                </div>
              )}

              <h3 style={{ fontSize: 16, margin: '10px 0 4px' }}>{art.title}</h3>
              <p style={{ fontSize: 14, margin: '0 0 4px', color: '#555' }}>
                {art.artistDisplayName || 'Unknown Artist'}
              </p>
              <a
                href={art.objectURL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 8, fontSize: 12, color: '#0070f3', textDecoration: 'none' }}
              >
                View on Met Museum
              </a>

              <FavoriteButton artwork={art} userId={userId} />
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
