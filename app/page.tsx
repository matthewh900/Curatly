"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  searchArtworks,
  getArtworksByIds,
  Artwork,
  Department,
} from "@/lib/api/met";
import FavoriteButton from "@/lib/components/favouriteButton";

export default function HomePage() {
  // Auth states
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Artworks & filters
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [query, setQuery] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (currentUser) {
        setUser(currentUser);
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", currentUser.id)
          .maybeSingle();
        if (profile?.display_name) setDisplayName(profile.display_name);
      }
    };

    fetchUserAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) setUser(session.user);
        else {
          setUser(null);
          setDisplayName(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("/api/departments");
        const data: Department[] = await res.json();
        setDepartments(data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    fetchDepartments();
  }, []);

  // Load artworks
  const loadArtworks = async () => {
    setLoading(true);
    setError(null);
    try {
      const searchTerm = query.trim() || "art";
      const ids = await searchArtworks(searchTerm, departmentId ?? undefined);
      if (ids.length === 0) {
        setArtworks([]);
        setLoading(false);
        return;
      }
      const fetchedArtworks = await getArtworksByIds(ids, 20);
      setArtworks(fetchedArtworks);
    } catch (err) {
      console.error("Artwork loading error:", err);
      setError("Failed to load artworks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load on first render
  useEffect(() => {
    loadArtworks();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDisplayName(null);
  };

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ textAlign: "center" }}>Welcome to Curatly</h1>

      {/* Auth */}
      <section style={{ textAlign: "center", marginBottom: 20 }}>
        {user ? (
          <>
            <p>
              Hello, <strong>{displayName ?? user.email}</strong>!
            </p>
            <Link href="/profile">
              <button style={buttonStyle}>Go to Profile</button>
            </Link>
            <button style={buttonStyle} onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <p>You are not logged in.</p>
            <Link href="/login">
              <button style={buttonStyle}>Login</button>
            </Link>
            <Link href="/signup">
              <button style={buttonStyle}>Sign Up</button>
            </Link>
          </>
        )}
      </section>

      {/* Search & Filter */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadArtworks();
        }}
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search artworks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={inputStyle}
          aria-label="Search artworks"
        />

        <select
          value={departmentId ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            setDepartmentId(value === "" ? null : Number(value));
          }}
          style={inputStyle}
          aria-label="Filter by department"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.departmentId} value={d.departmentId}>
              {d.displayName}
            </option>
          ))}
        </select>

        <button type="submit" style={buttonStyle}>
          Search
        </button>
      </form>

      {/* Loading/Error */}
      {loading && <p style={{ textAlign: "center" }}>Loading artworks...</p>}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      {!loading && artworks.length === 0 && (
        <p style={{ textAlign: "center" }}>No artworks found.</p>
      )}

      {/* Artworks */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 15,
        }}
      >
        {artworks.map((art) => (
          <article
            key={art.objectID}
            style={{
              border: "1px solid #ddd",
              borderRadius: 4,
              padding: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {art.primaryImageSmall ? (
              <img
                src={art.primaryImageSmall}
                alt={art.title}
                style={{
                  width: "100%",
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 4,
                }}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 140,
                  backgroundColor: "#eee",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                }}
              >
                No Image
              </div>
            )}
            <h3 style={{ fontSize: 16, margin: "10px 0 4px" }}>{art.title}</h3>
            <p style={{ fontSize: 14, margin: "0 0 4px", color: "#555" }}>
              {art.artistDisplayName || "Unknown Artist"}
            </p>
            <p style={{ fontSize: 12, margin: 0, color: "#777" }}>
              {art.objectDate}
            </p>
            <a
              href={art.objectURL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#0070f3",
                textDecoration: "none",
              }}
            >
              View on Met Museum
            </a>
            {user && <FavoriteButton artwork={art} userId={user?.id} />}
          </article>
        ))}
      </section>
    </main>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 4,
  border: "1px solid #0070f3",
  backgroundColor: "#0070f3",
  color: "white",
  cursor: "pointer",
  fontWeight: "500",
};

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 4,
  border: "1px solid #ccc",
  width: 180,
};
