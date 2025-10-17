"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Department } from "@/lib/api/met";
import { UnifiedArtwork } from "@/lib/types/unifiedArtwork";
import ArtworkCard from "@/lib/components/artworkCard";

export default function HomePage() {
  // Auth states
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Artworks & filters
  const [artworks, setArtworks] = useState<UnifiedArtwork[]>([]);
  const [query, setQuery] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [provider, setProvider] = useState<"met" | "aic">("met"); // Add provider state

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

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

  // Fetch departments (only relevant for MET)
  useEffect(() => {
    if (provider === "met") {
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
    } else {
      setDepartments([]); // Clear departments if provider isn't MET
      setDepartmentId(null); // Reset department filter on provider switch
    }
  }, [provider]);

  // Load artworks with pagination & filters
  const loadArtworks = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const searchTerm = query.trim() || "art";

      const params = new URLSearchParams({
        query: searchTerm,
        page: page.toString(),
        limit: itemsPerPage.toString(),
        provider,
      });

      if (provider === "met" && departmentId) {
        params.append("departmentId", departmentId.toString());
      }

      const res = await fetch(`/api/artworks?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Unknown error");

      setArtworks(data.artworks); // UnifiedArtwork[]
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);

      // Scroll to top after loading
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Artwork loading error:", err);
      setError("Failed to load artworks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load on first render & when filters change
  useEffect(() => {
    loadArtworks(1);
  }, [provider]); // Reload artworks when provider changes

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDisplayName(null);
  };

  return (
    <main style={mainStyle}>
      <h1 style={centeredTextStyle}>Welcome to Curatly</h1>

      {/* Auth */}
      <section style={centeredSectionStyle}>
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
          loadArtworks(1);
        }}
        style={searchFormStyle}
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
          value={provider}
          onChange={(e) => {
            const val = e.target.value as "met" | "aic";
            setProvider(val);
          }}
          style={inputStyle}
          aria-label="Select provider"
        >
          <option value="met">Met Museum</option>
          <option value="aic">Art Institute of Chicago</option>
        </select>

        {/* Show departments only if provider is Met */}
        {provider === "met" && (
          <select
            value={departmentId ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setDepartmentId(value === "" ? null : Number(value));
              loadArtworks(1);
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
        )}

        <button type="submit" style={buttonStyle}>
          Search
        </button>
      </form>

      {/* Loading/Error */}
      {loading && <p style={centeredTextStyle}>Loading artworks...</p>}
      {error && <p style={errorStyle}>{error}</p>}
      {!loading && artworks.length === 0 && (
        <p style={centeredTextStyle}>No artworks found.</p>
      )}

      {/* Artworks */}
      <section style={gridStyle}>
        {artworks.map((art) => (
          <ArtworkCard
            key={art.id} // updated to unified artwork id
            artwork={art}
            userId={user?.id ?? null}
          />
        ))}
      </section>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div style={paginationStyle}>
          <button
            onClick={() => loadArtworks(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ ...buttonStyle, marginRight: 10 }}
          >
            Previous
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => loadArtworks(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ ...buttonStyle, marginLeft: 10 }}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}

/* Reusable Styles Below */

const mainStyle: React.CSSProperties = {
  maxWidth: 700,
  margin: "2rem auto",
  padding: "0 1rem",
};

const centeredTextStyle: React.CSSProperties = {
  textAlign: "center",
};

const centeredSectionStyle: React.CSSProperties = {
  ...centeredTextStyle,
  marginBottom: 20,
};

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

const searchFormStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginBottom: 20,
  justifyContent: "center",
  flexWrap: "wrap",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: 15,
};

const errorStyle: React.CSSProperties = {
  color: "red",
  textAlign: "center",
};

const paginationStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: 20,
};
