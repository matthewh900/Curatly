"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
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

  // Load artworks with pagination
  const loadArtworks = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const searchTerm = query.trim() || "art";

      const params = new URLSearchParams({
        query: searchTerm,
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      if (departmentId) {
        params.append("departmentId", departmentId.toString());
      }

      const res = await fetch(`/api/artworks?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Unknown error");

      setArtworks(data.artworks);
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

  // Load on first render
  useEffect(() => {
    loadArtworks(1);
  }, []);

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
          <article key={art.objectID} style={artCardStyle}>
            {art.primaryImageSmall ? (
              <img
                src={art.primaryImageSmall}
                alt={art.title}
                style={artImageStyle}
                loading="lazy"
              />
            ) : (
              <div style={imagePlaceholderStyle}>No Image</div>
            )}
            <h3 style={artTitleStyle}>{art.title}</h3>
            <p style={artArtistStyle}>
              {art.artistDisplayName || "Unknown Artist"}
            </p>
            <p style={artDateStyle}>{art.objectDate}</p>
            <a
              href={art.objectURL}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              View on Met Museum
            </a>
            {user && <FavoriteButton artwork={art} userId={user?.id} />}
          </article>
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

/* ---------- 🧼 Reusable Styles Below ---------- */

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

const artCardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 4,
  padding: 10,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const artImageStyle: React.CSSProperties = {
  width: "100%",
  height: 140,
  objectFit: "cover",
  borderRadius: 4,
};

const imagePlaceholderStyle: React.CSSProperties = {
  width: "100%",
  height: 140,
  backgroundColor: "#eee",
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#999",
};

const artTitleStyle: React.CSSProperties = {
  fontSize: 16,
  margin: "10px 0 4px",
};

const artArtistStyle: React.CSSProperties = {
  fontSize: 14,
  margin: "0 0 4px",
  color: "#555",
};

const artDateStyle: React.CSSProperties = {
  fontSize: 12,
  margin: 0,
  color: "#777",
};

const linkStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: "#0070f3",
  textDecoration: "none",
};

const errorStyle: React.CSSProperties = {
  color: "red",
  textAlign: "center",
};

const paginationStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: 20,
};
