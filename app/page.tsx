"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };

    fetchUser();

    // Optional: subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", padding: "1rem" }}>
      <h1>Welcome to Curatly</h1>

      {user ? (
        <>
          <p>Hello, {user.email}!</p>
          <Link href="/profile">
            <button style={{ marginRight: 10 }}>Go to Profile</button>
          </Link>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <p>You are not logged in.</p>
          <Link href="/login">
            <button style={{ marginRight: 10 }}>Login</button>
          </Link>
          <Link href="/signup">
            <button>Sign Up</button>
          </Link>
        </>
      )}
    </main>
  );
}
