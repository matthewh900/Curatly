"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Department } from "@/lib/api/met";
import { UnifiedArtwork } from "@/lib/types/unifiedArtwork";
import ArtworkCard from "@/lib/components/artworkCard";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Artworks & Filters
  const [artworks, setArtworks] = useState<UnifiedArtwork[]>([]);
  const [query, setQuery] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [provider, setProvider] = useState<"met" | "aic">("met");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abort controller ref for cancellation
  const abortController = useRef<AbortController | null>(null);

  // Debounce timeout ref
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Parse URL query params once on mount and sync to state
  useEffect(() => {
    const urlQuery = searchParams.get("query") ?? "";
    const urlProvider = searchParams.get("provider") ?? "met";
    const urlDeptId = searchParams.get("departmentId");
    const urlPage = searchParams.get("page");

    setQuery(decodeURIComponent(urlQuery));
    setProvider(urlProvider === "aic" ? "aic" : "met");
    setDepartmentId(urlDeptId !== null ? Number(urlDeptId) : null);
    setCurrentPage(urlPage ? Number(urlPage) : 1);
  }, []);

  // Sync state to URL (debounced)
  useEffect(() => {
    // Clear previous debounce if exists
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      const params = new URLSearchParams();

      if (query.trim() !== "") params.set("query", encodeURIComponent(query.trim()));
      if (provider) params.set("provider", provider);
      if (provider === "met" && departmentId !== null) params.set("departmentId", departmentId.toString());
      params.set("page", currentPage.toString());

      router.replace(`/?${params.toString()}`);
    }, 300);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [query, provider, departmentId, currentPage, router]);

  // Load departments when provider changes to 'met'
  useEffect(() => {
    const fetchDepartments = async () => {
      if (provider !== "met") {
        setDepartments([]);
        setDepartmentId(null);
        return;
      }

      try {
        const res = await fetch("/api/departments");
        const data: Department[] = await res.json();
        setDepartments(data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };

    fetchDepartments();
  }, [provider]);

  // Load artworks whenever URL params/state change
  useEffect(() => {
    const loadArtworks = async (page = currentPage) => {
      if (abortController.current) abortController.current.abort();
      abortController.current = new AbortController();

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

        if (provider === "met" && departmentId !== null) {
          params.append("departmentId", departmentId.toString());
        }

        const res = await fetch(`/api/artworks?${params.toString()}`, {
          signal: abortController.current.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Unknown error");
        }

        const data = await res.json();

        setArtworks(data.artworks);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);

        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Artwork loading error:", err);
          setError("Failed to load artworks. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadArtworks(currentPage);
  }, [query, provider, departmentId, currentPage]);

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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser(session.user);
      else {
        setUser(null);
        setDisplayName(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Handlers

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDisplayName(null);
  };

  // Reset page to 1 on filters change helpers
  const onQueryChange = (val: string) => {
    setQuery(val);
    setCurrentPage(1);
  };

  const onProviderChange = (val: "met" | "aic") => {
    setProvider(val);
    setDepartmentId(null);
    setCurrentPage(1);
  };

  const onDepartmentChange = (val: string) => {
    setDepartmentId(val === "" ? null : Number(val));
    setCurrentPage(1);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <main style={mainStyle}>
        <h1 style={centeredTextStyle}>Welcome to Curatly</h1>

        {/* Auth Section */}
        <section style={centeredSectionStyle}>
          {user ? (
            <>
              <p>
                Hello, <strong>{displayName ?? user.email}</strong>!
              </p>
              <Link href="/profile">
                <button style={buttonStyle}>Go to Profile</button>
              </Link>
              <button onClick={handleLogout} style={buttonStyle}>
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

        {/* Search & Filters */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCurrentPage(1);
          }}
          style={searchFormStyle}
        >
          <input
            type="text"
            placeholder="Search artworks..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            style={inputStyle}
            aria-label="Search artworks"
          />

          <select
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as "met" | "aic")}
            style={inputStyle}
            aria-label="Select provider"
          >
            <option value="met">Met Museum</option>
            <option value="aic">Art Institute of Chicago</option>
          </select>

          {provider === "met" && (
            <select
              value={departmentId ?? ""}
              onChange={(e) => onDepartmentChange(e.target.value)}
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

        {/* Loading/Error states */}
        {error && <p style={errorStyle}>{error}</p>}
        {!loading && artworks.length === 0 && (
          <p style={centeredTextStyle}>No artworks found.</p>
        )}

        {/* Artworks Grid */}
        <section style={gridStyle}>
          {artworks.map((art) => (
            <ArtworkCard key={art.id} artwork={art} userId={user?.id ?? null} />
          ))}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={paginationStyle}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ ...buttonStyle, marginRight: 10 }}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ ...buttonStyle, marginLeft: 10 }}
            >
              Next
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div style={loadingOverlayStyle}>
            <div style={spinnerStyle} aria-label="Loading"></div>
          </div>
        )}
      </main>
    </>
  );
}

/* Reusable Styles Below */

const mainStyle: React.CSSProperties = {
  maxWidth: 700,
  margin: "2rem auto",
  padding: "0 1rem",
  position: "relative",
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

const loadingOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backdropFilter: "blur(4px)",
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const spinnerStyle: React.CSSProperties = {
  border: "6px solid #f3f3f3",
  borderTop: "6px solid #0070f3",
  borderRadius: "50%",
  width: 50,
  height: 50,
  animation: "spin 1s linear infinite",
};
