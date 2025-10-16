"use client";

import { useEffect, useState, useRef } from "react";
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
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string | null>(null);
  const [newExhibitionName, setNewExhibitionName] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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
        if (data.length > 0) setSelectedExhibitionId(data[0].id);
      }
      setLoading(false);
    };

    fetchExhibitions();
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    }

    if (modalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const openModal = () => {
    setMessage(null);
    setCreatingNew(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setMessage(null);
    setNewExhibitionName("");
    setCreatingNew(false);
    setModalOpen(false);
  };

  // Close modal after showing success message for 1.5 seconds
  const closeAfterDelay = () => {
    setTimeout(() => {
      closeModal();
    }, 1000);
  };

  const handleAdd = async () => {
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

    setSaving(false);

    if (error) {
      setMessage("Failed to add; it might already be in this exhibition.");
    } else {
      setMessage("Added to exhibition.");
      closeAfterDelay();
    }
  };

  const handleCreate = async () => {
    if (!newExhibitionName.trim()) {
      setMessage("Exhibition name cannot be empty.");
      return;
    }

    setSaving(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("exhibitions")
      .insert({ user_id: userId, name: newExhibitionName.trim() })
      .select()
      .single();

    if (error || !data) {
      setMessage("Failed to create exhibition.");
      setSaving(false);
      return;
    }

    const { error: addError } = await supabase.from("exhibition_favourites").insert({
      exhibition_id: data.id,
      favourite_id: favouriteId,
    });

    setSaving(false);

    if (addError) {
      setMessage("Created exhibition, but failed to add artwork.");
    } else {
      setMessage("Created exhibition and added artwork.");
      setExhibitions((prev) => [data, ...prev]);
      setSelectedExhibitionId(data.id);
      setNewExhibitionName("");
      setCreatingNew(false);
      closeAfterDelay();
    }
  };

  return (
    <>
      <button onClick={openModal} style={styles.openButton}>
        Add to Exhibition
      </button>

      {modalOpen && (
        <div style={styles.backdrop} aria-modal="true" role="dialog">
          <div ref={modalRef} style={styles.modal}>
            <button
              onClick={closeModal}
              aria-label="Close modal"
              style={styles.closeButton}
            >
              &times;
            </button>

            <h3>Add Artwork to Exhibition</h3>

            {loading ? (
              <p>Loading exhibitions...</p>
            ) : creatingNew ? (
              <>
                <input
                  type="text"
                  placeholder="New exhibition name"
                  value={newExhibitionName}
                  onChange={(e) => setNewExhibitionName(e.target.value)}
                  disabled={saving}
                  style={styles.input}
                />
                <button onClick={handleCreate} disabled={saving} style={styles.button}>
                  {saving ? "Creating..." : "Create & Add"}
                </button>
                <button onClick={() => setCreatingNew(false)} disabled={saving} style={styles.button}>
                  Cancel
                </button>
              </>
            ) : exhibitions.length === 0 ? (
              <>
                <p>No exhibitions yet.</p>
                <button onClick={() => setCreatingNew(true)} style={styles.button}>
                  Create New Exhibition
                </button>
              </>
            ) : (
              <>
                <select
                  value={selectedExhibitionId || ""}
                  onChange={(e) => setSelectedExhibitionId(e.target.value)}
                  disabled={saving}
                  style={styles.select}
                >
                  {exhibitions.map((exh) => (
                    <option key={exh.id} value={exh.id}>
                      {exh.name}
                    </option>
                  ))}
                </select>
                <button onClick={handleAdd} disabled={saving} style={styles.button}>
                  {saving ? "Adding..." : "Add"}
                </button>
                <button onClick={() => setCreatingNew(true)} disabled={saving} style={styles.button}>
                  Create New Exhibition
                </button>
              </>
            )}

            {message && <p style={styles.message}>{message}</p>}
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  openButton: {
    cursor: "pointer",
  },
  backdrop: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "black",
    padding: 20,
    borderRadius: 4,
    width: 320,
    maxWidth: "90%",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    position: "relative",
    color: "white",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
    lineHeight: 1,
    color: "white",
  },
  input: {
    width: "100%",
    padding: 8,
    marginBottom: 10,
    boxSizing: "border-box",
    backgroundColor: "#222",
    border: "1px solid #444",
    color: "white",
    borderRadius: 4,
  },
  select: {
    width: "100%",
    padding: 8,
    marginBottom: 10,
    boxSizing: "border-box",
    backgroundColor: "#222",
    border: "1px solid #444",
    color: "white",
    borderRadius: 4,
  },
  button: {
    cursor: "pointer",
    marginRight: 8,
    padding: "6px 12px",
  },
  message: {
    marginTop: 12,
  },
};
