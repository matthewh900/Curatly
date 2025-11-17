"use client";

import styles from "@/lib/styles/homePage.module.css";
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
  const [searchInput, setSearchInput] = useState("");

  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [provider, setProvider] = useState<"met" | "aic">("met");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 21;
  const [canPaginate, setCanPaginate] = useState(true);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortController = useRef<AbortController | null>(null);
  const initialLoadDone = useRef(false);

  // Parse URL query params on mount
  useEffect(() => {
    const urlQuery = searchParams.get("query") ?? "";
    const urlProvider = searchParams.get("provider") ?? "met";
    const urlDeptId = searchParams.get("departmentId");
    const urlPage = searchParams.get("page");

    const decoded = decodeURIComponent(urlQuery);

    setQuery(decoded);
    setSearchInput(decoded);

    setProvider(urlProvider === "aic" ? "aic" : "met");
    setDepartmentId(urlDeptId ? Number(urlDeptId) : null);
    setCurrentPage(urlPage ? Number(urlPage) : 1);

    initialLoadDone.current = true;
  }, []);

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

  // Fetch artworks whenever query, provider, department, or page changes
  useEffect(() => {
    if (!initialLoadDone.current) return;

    if (abortController.current) abortController.current.abort();
    const controller = new AbortController();
    abortController.current = controller;

    const fetchArtworks = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchTerm = query.trim() || "art";
        const params = new URLSearchParams({
          query: searchTerm,
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          provider,
        });
        if (provider === "met" && departmentId !== null) {
          params.append("departmentId", departmentId.toString());
        }

        const res = await fetch(`/api/artworks?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Unknown error");
        }

        const data = await res.json();
        setArtworks(data.artworks);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);

        // Sync URL
        const urlParams = new URLSearchParams();
        if (query.trim() !== "")
          urlParams.set("query", encodeURIComponent(query.trim()));
        urlParams.set("provider", provider);
        if (provider === "met" && departmentId !== null)
          urlParams.set("departmentId", departmentId.toString());
        urlParams.set("page", data.page.toString());
        router.replace(`/?${urlParams.toString()}`);

        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError("Failed to load artworks. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();

    // Cooldown for pagination
    setCanPaginate(false);
    const cooldown = setTimeout(() => setCanPaginate(true), 500);

    return () => {
      controller.abort();
      clearTimeout(cooldown);
    };
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

  // Handlers
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDisplayName(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setQuery(searchInput);
  };

  const handlePageChange = (newPage: number) => {
    if (!canPaginate || newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.centeredText}>Welcome to Curatly</h1>

      {/* Auth Section */}
      <section className={styles.centeredSection}>
        {user ? (
          <>
            <p>
              Hello, <strong>{displayName ?? user.email}</strong>!
            </p>
            <Link href="/profile">
              <button className={styles.button}>Go to Profile</button>
            </Link>
            <button onClick={handleLogout} className={styles.button}>
              Logout
            </button>
          </>
        ) : (
          <>
            <p>You are not logged in.</p>
            <Link href="/login">
              <button className={styles.button}>Login</button>
            </Link>
            <Link href="/signup">
              <button className={styles.button}>Sign Up</button>
            </Link>
          </>
        )}
      </section>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          placeholder="Search artworks..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={styles.input}
          aria-label="Search artworks"
        />

        <select
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value as "met" | "aic");
            setDepartmentId(null);
            setCurrentPage(1);
          }}
          className={styles.input}
          aria-label="Select provider"
        >
          <option value="met">Met Museum</option>
          <option value="aic">Art Institute of Chicago</option>
        </select>

        {provider === "met" && (
          <select
            value={departmentId ?? ""}
            onChange={(e) =>
              setDepartmentId(
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            className={styles.input}
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

        <button type="submit" className={styles.button}>
          Search
        </button>
      </form>

      {/* Loading/Error states */}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && artworks.length === 0 && (
        <p className={styles.centeredText}>No artworks found.</p>
      )}

      {/* Artworks Grid */}
      <section className={styles.grid}>
        {artworks.map((art) => (
          <ArtworkCard key={art.id} artwork={art} userId={user?.id ?? null} />
        ))}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || !canPaginate}
            className={styles.button}
            style={{ marginRight: 10 }}
          >
            Previous
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || !canPaginate}
            className={styles.button}
            style={{ marginLeft: 10 }}
          >
            Next
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} aria-label="Loading"></div>
        </div>
      )}
    </main>
  );
}
