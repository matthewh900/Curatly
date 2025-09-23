"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push("/profile"); // or wherever you want
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: "2rem auto", padding: "1rem" }}>
      <h1>Log In</h1>
      <form onSubmit={handleLogin}>
        <label>Email:</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: "1rem" }}
        />

        <label>Password:</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: "1rem" }}
        />

        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
