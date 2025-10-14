"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ArtworkCard from "@/lib/components/artworkCard";
import { FavouritedArtwork } from "@/app/favourites/page";

interface Exhibition {
  id: string;
  user_id: string;
  name: string;
  description?: string;
}

interface ExhibitionClientProps {
  exhibition: Exhibition;
  initialFavourites: FavouritedArtwork[];
}

export default function ExhibitionClient({
  exhibition,
  initialFavourites,
}: ExhibitionClientProps) {
  const [name, setName] = useState(exhibition.name);
  const [description, setDescription] = useState(exhibition.description || "");
  const [favourites, setFavourites] = useState<FavouritedArtwork[]>(initialFavourites);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("exhibitions")
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exhibition.id)
      .eq("user_id", exhibition.user_id);

    setSaving(false);

    if (error) {
      alert("Failed to save exhibition details.");
    } else {
      alert("Exhibition updated!");
    }
  };

  return (
    <main style={containerStyle}>
      <h1 style={headerStyle}>Exhibition: {exhibition.name}</h1>

      <section style={formSection}>
        <label>
          Name:
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          Description:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={textareaStyle}
          />
        </label>

        <button onClick={handleSave} style={buttonStyle} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </section>

      <section style={gridStyle}>
        {favourites.length === 0 ? (
          <p>No artworks in this exhibition yet.</p>
        ) : (
          favourites.map((art) => (
            <ArtworkCard key={art.favouriteId} artwork={art} />
          ))
        )}
      </section>
    </main>
  );
}

/* Styles */

const containerStyle: React.CSSProperties = {
  maxWidth: 700,
  margin: "2rem auto",
  padding: "0 1rem",
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: 20,
};

const formSection: React.CSSProperties = {
  marginBottom: 30,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
  fontSize: 16,
  borderRadius: 4,
  border: "1px solid #ccc",
  marginTop: 4,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 80,
  padding: 8,
  fontSize: 16,
  borderRadius: 4,
  border: "1px solid #ccc",
  marginTop: 4,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  width: 120,
  padding: "10px 16px",
  fontSize: 16,
  borderRadius: 4,
  backgroundColor: "#0070f3",
  color: "white",
  border: "none",
  cursor: "pointer",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: 15,
};
