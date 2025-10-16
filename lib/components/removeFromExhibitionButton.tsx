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
      onRemoved(); // Tell the parent to remove from state
    }

    setRemoving(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={removing}
      style={{
        marginTop: "0.75rem",
        padding: "0.4rem 0.75rem",
        fontSize: "0.9rem",
        backgroundColor: "#e00",
        color: "#fff",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
        width: "100%",
      }}
    >
      {removing ? "Removing..." : "Remove from Exhibition"}
    </button>
  );
}
