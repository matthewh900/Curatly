"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

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
    <main style={{ maxWidth: 400, margin: "2rem auto", padding: "1rem" }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignUp}>
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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: "1rem" }}
        />

        <label>Confirm Password:</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ width: "100%", marginBottom: "1rem" }}
        />

        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
        {successMsg && <p style={{ color: "green" }}>{successMsg}</p>}

        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </main>
  );
}
