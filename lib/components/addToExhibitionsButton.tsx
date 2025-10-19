"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/favouritesPage.module.css";

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

    try {
      // Get max position in this exhibition
      const { data: positions, error: posError } = await supabase
        .from("exhibition_favourites")
        .select("position")
        .eq("exhibition_id", selectedExhibitionId)
        .order("position", { ascending: false })
        .limit(1);

      if (posError) throw posError;

      const nextPosition = positions && positions.length > 0 ? positions[0].position + 1 : 1;

      // Insert with position
      const { error: insertError } = await supabase.from("exhibition_favourites").insert({
        exhibition_id: selectedExhibitionId,
        favourite_id: favouriteId,
        position: nextPosition,
      });

      if (insertError) throw insertError;

      setMessage("Added to exhibition.");
      closeAfterDelay();
    } catch (error: any) {
      setMessage(
        error.message || "Failed to add; it might already be in this exhibition."
      );
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newExhibitionName.trim()) {
      setMessage("Exhibition name cannot be empty.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from("exhibitions")
        .insert({ user_id: userId, name: newExhibitionName.trim() })
        .select()
        .single();

      if (error || !data) {
        throw error || new Error("Failed to create exhibition.");
      }

      // Insert artwork with position 1 since new exhibition
      const { error: addError } = await supabase.from("exhibition_favourites").insert({
        exhibition_id: data.id,
        favourite_id: favouriteId,
        position: 1,
      });

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
    } catch (error: any) {
      setMessage(error.message || "Failed to create exhibition.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button onClick={openModal} className={styles.openButton}>
        Add to Exhibition
      </button>

      {modalOpen && (
        <div className={styles.backdrop} aria-modal="true" role="dialog">
          <div ref={modalRef} className={styles.modal}>
            <button
              onClick={closeModal}
              aria-label="Close modal"
              className={styles.closeButton}
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
                  className={styles.input}
                />
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className={styles.button}
                >
                  {saving ? "Creating..." : "Create & Add"}
                </button>
                <button
                  onClick={() => setCreatingNew(false)}
                  disabled={saving}
                  className={styles.button}
                >
                  Cancel
                </button>
              </>
            ) : exhibitions.length === 0 ? (
              <>
                <p>No exhibitions yet.</p>
                <button
                  onClick={() => setCreatingNew(true)}
                  className={styles.button}
                >
                  Create New Exhibition
                </button>
              </>
            ) : (
              <>
                <select
                  value={selectedExhibitionId || ""}
                  onChange={(e) => setSelectedExhibitionId(e.target.value)}
                  disabled={saving}
                  className={styles.select}
                >
                  {exhibitions.map((exh) => (
                    <option key={exh.id} value={exh.id}>
                      {exh.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className={styles.button}
                >
                  {saving ? "Adding..." : "Add"}
                </button>
                <button
                  onClick={() => setCreatingNew(true)}
                  disabled={saving}
                  className={styles.button}
                >
                  Create New Exhibition
                </button>
              </>
            )}

            {message && <p className={styles.message}>{message}</p>}
          </div>
        </div>
      )}
    </>
  );
}
