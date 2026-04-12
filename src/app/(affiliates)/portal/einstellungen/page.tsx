"use client";

import { useEffect, useState } from "react";
import { Settings, Loader2, Check, AlertCircle } from "lucide-react";

interface Profile {
  name: string;
  email: string;
  handle: string;
  commissionRate: number;
  status: string;
  createdAt: string;
}

export default function EinstellungenPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/affiliates/me")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
        setLoading(false);
      });
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/affiliates/me/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        const updated = await res.json();
        setName(updated.name);
        setEmail(updated.email);
        setProfileMsg({ type: "ok", text: "Gespeichert" });
      } else {
        const data = await res.json();
        setProfileMsg({ type: "err", text: data.error ?? "Fehler beim Speichern" });
      }
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword.length < 8) {
      setPwMsg({ type: "err", text: "Neues Passwort muss mindestens 8 Zeichen lang sein" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "err", text: "Passwörter stimmen nicht überein" });
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch("/api/affiliates/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (res.ok) {
        setPwMsg({ type: "ok", text: "Passwort geändert" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setPwMsg({ type: "err", text: data.error ?? "Fehler beim Ändern" });
      }
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#FFC62C]" />
          Einstellungen
        </h1>
      </div>

      {/* Profile info (read-only) */}
      <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Konto</p>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Handle</span>
            <span className="text-white font-mono">@{profile?.handle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Kommission</span>
            <span className="text-white">
              {Math.round((profile?.commissionRate ?? 0) * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Mitglied seit</span>
            <span className="text-white">
              {profile?.createdAt &&
                new Date(profile.createdAt).toLocaleDateString("de-DE")}
            </span>
          </div>
        </div>
      </div>

      {/* Profile edit form */}
      <form onSubmit={handleProfileSave} className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Profil bearbeiten</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[#FFC62C]/40 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[#FFC62C]/40 focus:outline-none"
              required
            />
          </div>
        </div>
        {profileMsg && (
          <div
            className={`mt-3 flex items-center gap-1.5 text-xs ${
              profileMsg.type === "ok" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {profileMsg.type === "ok" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {profileMsg.text}
          </div>
        )}
        <button
          type="submit"
          disabled={profileSaving}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#FFC62C] px-4 py-2 text-sm font-semibold text-black hover:bg-[#FFD24D] transition-colors disabled:opacity-50"
        >
          {profileSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Speichern
        </button>
      </form>

      {/* Password change */}
      <form onSubmit={handlePasswordChange}>
        <h2 className="text-lg font-semibold text-white mb-4">Passwort ändern</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              Aktuelles Passwort
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[#FFC62C]/40 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              Neues Passwort
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[#FFC62C]/40 focus:outline-none"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[#FFC62C]/40 focus:outline-none"
              required
              minLength={8}
            />
          </div>
        </div>
        {pwMsg && (
          <div
            className={`mt-3 flex items-center gap-1.5 text-xs ${
              pwMsg.type === "ok" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {pwMsg.type === "ok" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {pwMsg.text}
          </div>
        )}
        <button
          type="submit"
          disabled={pwSaving}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.12] transition-colors disabled:opacity-50"
        >
          {pwSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Passwort ändern
        </button>
      </form>
    </div>
  );
}
