"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [exhibitions, setExhibitions] = useState<any[]>([]);

  // Fetch user profile & exhibitions
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

      // Fetch exhibitions
      const { data: exhibitionsData, error: exhibitionsError } = await supabase
        .from("exhibitions")
        .select("id, name, description")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (exhibitionsError) {
        console.error("Error loading exhibitions:", exhibitionsError);
      } else {
        setExhibitions(exhibitionsData || []);
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
    <main style={{ maxWidth: 600, margin: "2rem auto", padding: "1rem" }}>
      <h1>Your Profile</h1>

      <label>Display Name:</label>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        style={{ width: "100%", marginBottom: "1rem" }}
        placeholder="Enter display name"
      />

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: "green" }}>{successMsg}</p>}

      <button onClick={handleSave} disabled={saving} style={{ width: "100%" }}>
        {saving ? "Saving..." : "Save Display Name"}
      </button>

      {/* Favourites Link Section */}
      <section style={{ marginTop: "3rem" }}>
        <h2>Your Favourites</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li
            style={{
              border: "1px solid #ddd",
              borderRadius: 4,
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <Link
              href="/favourites"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h3 style={{ margin: 0 }}>View Your Favourites</h3>
              <p style={{ margin: 0, color: "#555" }}>
                Browse all the artworks you've favourited.
              </p>
            </Link>
          </li>
        </ul>
      </section>

      {/* Exhibitions Section */}
      <section style={{ marginTop: "3rem" }}>
        <h2>Your Exhibitions</h2>

        {exhibitions.length === 0 ? (
          <p>You haven't created any exhibitions yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {exhibitions.map((exhibition) => (
              <li
                key={exhibition.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  padding: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <Link
                  href={`/exhibitions/${exhibition.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <h3 style={{ margin: "0 0 0.5rem" }}>{exhibition.name}</h3>
                  <p style={{ margin: 0, color: "#555" }}>
                    {exhibition.description || "No description provided."}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
