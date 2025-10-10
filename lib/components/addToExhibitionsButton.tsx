"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface AddToExhibitionButtonProps {
  favouriteId: string;
  userId: string;
}

interface Exhibition {
  id: string;
  name: string;
}

export default function AddToExhibitionButton({
  favouriteId,
  userId,
}: AddToExhibitionButtonProps) {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newExhibitionName, setNewExhibitionName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchExhibitions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("exhibitions")
        .select("id, name")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setExhibitions(data);
        if (data.length > 0) {
          setSelectedExhibitionId(data[0].id);
        }
      }
      setLoading(false);
    };

    fetchExhibitions();
  }, [userId]);

  const handleAddToExhibition = async () => {
    if (!selectedExhibitionId) {
      setMessage("Please select an exhibition.");
      return;
    }

    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from("exhibition_favourites").insert({
      exhibition_id: selectedExhibitionId,
      favourite_id: favouriteId,
    });

    if (error) {
      console.error("Add to exhibition error:", error);
      setMessage("Failed to add. It might already be in the exhibition.");
    } else {
      setMessage("Added to exhibition.");
    }

    setSaving(false);
  };

  const handleCreateExhibition = async () => {
    if (!newExhibitionName.trim()) {
      setMessage("Exhibition name cannot be empty.");
      return;
    }

    setSaving(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("exhibitions")
      .insert({
        user_id: userId,
        name: newExhibitionName.trim(),
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Create exhibition error:", error);
      setMessage("Failed to create exhibition.");
      setSaving(false);
      return;
    }

    // Add to the new exhibition
    const { error: addError } = await supabase.from("exhibition_favourites").insert({
      exhibition_id: data.id,
      favourite_id: favouriteId,
    });

    if (addError) {
      console.error("Add to new exhibition error:", addError);
      setMessage("Created exhibition, but failed to add favourite.");
    } else {
      setMessage("Created exhibition and added favourite.");
      setExhibitions((prev) => [data, ...prev]);
      setSelectedExhibitionId(data.id);
      setNewExhibitionName("");
      setCreating(false);
    }

    setSaving(false);
  };

  if (loading) return <p>Loading exhibitions...</p>;

  if (exhibitions.length === 0 && !creating) {
    return (
      <div>
        <p>You have no exhibitions yet.</p>
        <button onClick={() => setCreating(true)}>Create New Exhibition</button>
        {message && <p>{message}</p>}
      </div>
    );
  }

  return (
    <div>
      {creating ? (
        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Exhibition name"
            value={newExhibitionName}
            onChange={(e) => setNewExhibitionName(e.target.value)}
            style={{ width: "100%", marginBottom: 4 }}
          />
          <button onClick={handleCreateExhibition} disabled={saving} style={{ marginRight: 8 }}>
            {saving ? "Creating..." : "Create & Add"}
          </button>
          <button onClick={() => setCreating(false)} disabled={saving}>
            Cancel
          </button>
          {message && <p>{message}</p>}
        </div>
      ) : (
        <div style={{ marginBottom: 8 }}>
          <select
            value={selectedExhibitionId || ""}
            onChange={(e) => setSelectedExhibitionId(e.target.value)}
            style={{ marginRight: 8 }}
          >
            {exhibitions.map((exh) => (
              <option key={exh.id} value={exh.id}>
                {exh.name}
              </option>
            ))}
          </select>
          <button onClick={handleAddToExhibition} disabled={saving}>
            {saving ? "Adding..." : "Add to Exhibition"}
          </button>
          <button onClick={() => setCreating(true)} style={{ marginLeft: 8 }}>
            Create New Exhibition
          </button>
          {message && <p>{message}</p>}
        </div>
      )}
    </div>
  );
}
