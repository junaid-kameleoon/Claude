import { useEffect, useState, type ReactNode } from "react";

/**
 * Client-side password gate.
 *
 * IMPORTANT — this is NOT real security. GitHub Pages is fully static, so the
 * compact trace JSON ships in the deployed bundle and a determined visitor can
 * read it from the network tab regardless of this gate. It only deters casual
 * access. For genuine protection, host behind real auth or encrypt the data.
 *
 * To change the password: run
 *   node -e 'console.log(require("crypto").createHash("sha256").update("YOUR_PW").digest("hex"))'
 * and paste the result into PASSWORD_HASH below.
 *
 * Default placeholder password: "kameleoon-ai"
 */
const PASSWORD_HASH = "5cab6478ff20296bb016338384110402afc9b70ccb43853757353a07d33d135d";
const STORAGE_KEY = "ai-trace-explorer-auth";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function Gate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === PASSWORD_HASH) setUnlocked(true);
  }, []);

  if (unlocked) return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError("");
    const hash = await sha256(value);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(STORAGE_KEY, hash);
      setUnlocked(true);
    } else {
      setError("Incorrect password.");
      setValue("");
    }
    setChecking(false);
  };

  return (
    <div className="gate">
      <form className="gate-card" onSubmit={submit}>
        <div className="g-brand">
          <span className="dot" /> AI Trace Explorer
        </div>
        <p className="g-sub">Kameleoon internal dashboard</p>
        <label htmlFor="pw">Password</label>
        <input
          id="pw"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" disabled={checking}>
          {checking ? "Checking…" : "Unlock"}
        </button>
        <div className="g-error">{error}</div>
        <p className="g-note">
          Internal use only. This is a client-side gate — it deters casual access but is not a substitute for real
          authentication.
        </p>
      </form>
    </div>
  );
}

export function logout() {
  sessionStorage.removeItem(STORAGE_KEY);
  location.reload();
}
