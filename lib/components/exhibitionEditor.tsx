"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ArtworkCard from "@/lib/components/artworkCard";
import RemoveFromExhibitionButton from "@/lib/components/removeFromExhibitionButton";
import { ExhibitionArtwork } from "@/app/exhibitions/[id]/page";
import styles from "@/lib/styles/exhibitionPage.module.css";

interface ExhibitionEditorProps {
  exhibition: {
    id: string;
    name: string;
    description: string | null;
  };
  artworks: ExhibitionArtwork[];
}

export default function ExhibitionEditor({
  exhibition,
  artworks: initialArtworks,
}: ExhibitionEditorProps) {
  const [name, setName] = useState(exhibition.name);
  const [description, setDescription] = useState(exhibition.description || "");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [artworks, setArtworks] = useState(initialArtworks);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const { error } = await supabase
      .from("exhibitions")
      .update({
        name,
        description,
      })
      .eq("id", exhibition.id);

    if (error) {
      setErrorMsg("Failed to save exhibition.");
      console.error(error.message);
    } else {
      setSuccessMsg("Exhibition updated successfully.");
    }

    setSaving(false);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Edit Exhibition</h1>

      <label className={styles.label}>Name:</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.input}
        disabled={saving}
      />

      <label className={styles.label}>Description:</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={styles.textarea}
        disabled={saving}
      />

      {errorMsg && <p className={styles.error}>{errorMsg}</p>}
      {successMsg && <p className={styles.success}>{successMsg}</p>}

      <button
        onClick={handleSave}
        className={`${styles.button} ${
          saving || !name.trim() ? styles.buttonDisabled : ""
        }`}
        disabled={saving || !name.trim()}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      <h2 className={styles.artworksHeading}>Artworks in this Exhibition</h2>

      <section className={styles.artworksSection}>
        {artworks.length === 0 ? (
          <p>No artworks added to this exhibition yet.</p>
        ) : (
          artworks.map((artwork) => (
            <ArtworkCard
              key={artwork.id}
              artwork={{
                id: artwork.id,
                provider: artwork.provider,
                title: artwork.title,
                artist: artwork.artist,
                imageUrl: artwork.image_url,
                artworkUrl: artwork.artwork_url,
                date: "",
                description: undefined,
              }}
            >
              <RemoveFromExhibitionButton
                exhibitionId={exhibition.id}
                favouriteId={artwork.id}
                onRemoved={() =>
                  setArtworks((prev) => prev.filter((a) => a.id !== artwork.id))
                }
              />
            </ArtworkCard>
          ))
        )}
      </section>
    </div>
  );
}
