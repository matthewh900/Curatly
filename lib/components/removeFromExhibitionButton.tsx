"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface RemoveFromExhibitionButtonProps {
  exhibitionId: string;
  favouriteId: string;
  onRemoved: () => void;
}

export default function RemoveFromExhibitionButton({
  exhibitionId,
  favouriteId,
  onRemoved,
}: RemoveFromExhibitionButtonProps) {
  const [removing, setRemoving] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleClick = async () => {
    if (!window.confirm("Remove this artwork from the exhibition?")) return;

    setRemoving(true);

    const { error } = await supabase
      .from("exhibition_favourites")
      .delete()
      .match({
        exhibition_id: exhibitionId,
        favourite_id: favouriteId,
      });

    if (error) {
      console.error("Error removing artwork:", error.message);
      alert("Failed to remove artwork.");
    } else {
      onRemoved();
    }

    setRemoving(false);
  };

  const combinedStyle = {
    ...styles.base,
    ...(hovered && !removing ? styles.hover : {}),
    ...(removing ? styles.disabled : {}),
  };

  return (
    <button
      onClick={handleClick}
      disabled={removing}
      style={combinedStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-busy={removing}
    >
      {removing ? "Removing..." : "Remove from Exhibition"}
    </button>
  );
}

const styles = {
  base: {
    marginTop: "0.75rem",
    padding: "0.5rem 1rem",
    fontSize: "1rem",
    border: "none",
    borderRadius: "6px",
    width: "100%",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    color: "#fff",
    userSelect: "none" as const,
    opacity: 1,
  },
  hover: {
    backgroundColor: "#67d06b",
  },
  disabled: {
    cursor: "not-allowed",
    opacity: 0.7,
  },
};
