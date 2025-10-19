"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/lib/styles/loginPage.module.css";

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
      router.push("/profile");
    }
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.header}>Log In</h1>
      <form onSubmit={handleLogin}>
        <label className={styles.label}>Email:</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
        />

        <label className={styles.label}>Password:</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />

        {errorMsg && <p className={styles.error}>{errorMsg}</p>}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
