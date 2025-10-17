"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ArtworkCard from "@/lib/components/artworkCard";
import RemoveFromExhibitionButton from "@/lib/components/removeFromExhibitionButton";
import { ExhibitionArtwork } from "@/app/exhibitions/[id]/page";

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
    <div style={styles.container}>
      <h1 style={styles.heading}>Edit Exhibition</h1>

      <label style={styles.label}>Name:</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={styles.input}
        disabled={saving}
      />

      <label style={styles.label}>Description:</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={styles.textarea}
        disabled={saving}
      />

      {errorMsg && <p style={styles.error}>{errorMsg}</p>}
      {successMsg && <p style={styles.success}>{successMsg}</p>}

      <button onClick={handleSave} style={styles.button} disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </button>

      <h2 style={{ marginTop: "2rem" }}>Artworks in this Exhibition</h2>

      <section style={styles.artworksSection}>
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

// Styles

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "1rem",
    maxWidth: 800,
    margin: "0 auto",
  },
  heading: {
    fontSize: "1.8rem",
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    marginBottom: "0.25rem",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    marginBottom: "1rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: 4,
  },
  textarea: {
    width: "100%",
    height: 100,
    padding: "0.5rem",
    marginBottom: "1rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: 4,
    resize: "vertical",
  },
  button: {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    marginBottom: "1rem",
  },
  error: {
    color: "red",
    marginBottom: "1rem",
  },
  success: {
    color: "green",
    marginBottom: "1rem",
  },
  artworksSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1.5rem",
  },
};
