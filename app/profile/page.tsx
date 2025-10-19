"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import styles from "@/styles/profilePage.module.css";
import ExhibitionCard from "@/lib/components/exhibitionCard";

interface ExhibitionWithThumbnail {
  id: string;
  name: string;
  description: string | null;
  thumbnail?: string | null;
}

export default function ProfilePage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [exhibitions, setExhibitions] = useState<ExhibitionWithThumbnail[]>([]);

  useEffect(() => {
    const getProfileAndExhibitions = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMsg("Failed to load profile.");
        console.error(profileError);
      } else if (profile?.display_name) {
        setDisplayName(profile.display_name);
      }

      // Fetch exhibitions + one favourite thumbnail each
      const { data: exhibitionsData, error: exhibitionsError } = await supabase
        .from("exhibitions")
        .select(`
          id,
          name,
          description,
          exhibition_favourites (
            position,
            favourite: favourites!inner (
              id,
              title,
              image_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (exhibitionsError) {
        console.error("Error loading exhibitions:", exhibitionsError);
      } else if (exhibitionsData) {
        // For each exhibition, pick the favourite with the smallest position for thumbnail
        const exWithThumbs: ExhibitionWithThumbnail[] = exhibitionsData.map((ex: any) => {
          const sortedFavs = (ex.exhibition_favourites || []).sort(
            (a: any, b: any) => a.position - b.position
          );
          const firstFav = sortedFavs[0]?.favourite;
          return {
            id: ex.id,
            name: ex.name,
            description: ex.description,
            thumbnail: firstFav?.image_url || null,
          };
        });
        setExhibitions(exWithThumbs);
      }

      setLoading(false);
    };

    getProfileAndExhibitions();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!displayName.trim()) {
      setErrorMsg("Display name cannot be empty.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: displayName.trim(),
    });

    if (error) {
      console.error(error);
      setErrorMsg("Failed to update display name.");
    } else {
      setSuccessMsg("Display name updated successfully.");
      router.push("/");
    }

    setSaving(false);
  };

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading profile...</p>;
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Your Profile</h1>

      <label htmlFor="displayName">Display Name:</label>
      <input
        id="displayName"
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Enter display name"
        className={styles.input}
      />

      {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}
      {successMsg && <p className={styles.successMsg}>{successMsg}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className={styles.button}
        type="button"
      >
        {saving ? "Saving..." : "Save Display Name"}
      </button>

      {/* Favourites Section */}
      <section className={styles.section}>
        <h2 className={styles.heading}>Your Favourites</h2>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <Link href="/favourites" className={styles.link}>
              <h3>View Your Favourites</h3>
              <p className={styles.subHeading}>
                Browse all the artworks you've favourited.
              </p>
            </Link>
          </li>
        </ul>
      </section>

      {/* Exhibitions Section */}
      <section className={styles.section}>
        <h2 className={styles.heading}>Your Exhibitions</h2>

        {exhibitions.length === 0 ? (
          <p>You haven't created any exhibitions yet.</p>
        ) : (
          <ul className={styles.list}>
            {exhibitions.map((exhibition) => (
              <li key={exhibition.id} className={styles.listItem}>
                <ExhibitionCard exhibition={exhibition} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
