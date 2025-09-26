"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
  
      const currentUser = authData?.user;
  
      if (currentUser) {
        setUser(currentUser);
  
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", currentUser.id)
          .maybeSingle();
  
        if (profile?.display_name) {
          setDisplayName(profile.display_name);
        }
      }
    };
  
    fetchUserAndProfile();
  
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setDisplayName(null);
      }
    });
  
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);  

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDisplayName(null);
  };

  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", padding: "1rem" }}>
      <h1>Welcome to Curatly</h1>

      {user ? (
        <>
          <p>Hello, {displayName ?? user.email}!</p>
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
