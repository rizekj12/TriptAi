import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import ScrapbookBackground from "./ScrapbookBackground";

// Shared shell for the sign-in, sign-up and password screens: scrapbook background,
// app name, and a frosted card for the form.
export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 text-white">
      <ScrapbookBackground />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center gap-3"
      >
        {/* Plane icon in a white circle, then the wordmark with the tagline left-aligned under it */}
        <span className="glass-strong flex h-[73px] w-[73px] flex-none items-center justify-center rounded-full shadow-sm">
          <img src="/illustrations/plane-mark.png" alt="" className="h-[46px] w-[46px] object-contain" />
        </span>
        <div className="flex flex-col items-start">
          <h1 className="drop-shadow">
            <img src="/illustrations/triptai-wordmark-white.svg" alt="TriptAi" className="h-[46px] w-auto" />
          </h1>
          <p className="mt-1 text-sm text-white/80 drop-shadow">Plan less. Travel more.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-sm rounded-3xl bg-white/15 p-6 shadow-2xl ring-1 ring-white/25 backdrop-blur-md sm:p-8"
      >
        {children}
      </motion.div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl bg-white/90 py-3 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

// Labelled input with a leading icon. type="password" gets a show/hide toggle.
export function AuthInput({ label, icon: Icon, type = "text", ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/70">{label}</span>
      <span className="relative block">
        <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={isPassword && visible ? "text" : type}
          className={`${inputClass} ${isPassword ? "pr-10" : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </span>
    </label>
  );
}

// Error (red) or success (green) message inside the card
export function AuthMessage({ type = "error", children }) {
  if (!children) return null;
  return (
    <div
      className={`rounded-xl px-4 py-2.5 text-sm ${
        type === "success" ? "bg-brand-500/30 text-brand-50" : "bg-red-500/30 text-red-50"
      }`}
    >
      {children}
    </div>
  );
}

export function AuthButton({ busy, busyLabel, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-xl border-2 border-white bg-page py-3 font-[Arial,Helvetica,sans-serif] text-[18px] font-normal leading-tight text-white shadow-lg transition hover:bg-brand-950 hover:shadow-xl disabled:opacity-60"
    >
      {busy ? busyLabel : children}
    </button>
  );
}
