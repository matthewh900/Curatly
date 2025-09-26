"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch user and profile
  useEffect(() => {
    const getProfile = async () => {
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

      setLoading(false);
    };

    getProfile();
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
      router.push("/")
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
    </main>
  );
}
