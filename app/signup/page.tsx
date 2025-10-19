"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/lib/styles/signUpPage.module.css";

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg("Check your email to confirm your account");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.header}>Sign Up</h1>
      <form onSubmit={handleSignUp}>
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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />

        <label className={styles.label}>Confirm Password:</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={styles.input}
        />

        {errorMsg && <p className={styles.error}>{errorMsg}</p>}
        {successMsg && <p className={styles.success}>{successMsg}</p>}

        <button type="submit" disabled={loading} >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </main>
  );
}
