import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import ScrapbookBackground from "./ScrapbookBackground";

// Shared shell for the sign-in, sign-up and password screens: night-sky background with clouds,
// sun and a plane, the logo, and a light card for the form.
export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 text-white">
      <ScrapbookBackground />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center gap-2"
      >
        {/* Logo: the plane (tilted up-left, white star) in a white circle, then the dark teal "Tript" / slate "Ai"
            wordmark with the tagline tucked underneath it */}
        <span className="flex h-[58px] w-[58px] flex-none items-center justify-center rounded-full bg-white shadow-sm">
          <img src="/illustrations/plane-mark-night.png" alt="" className="h-[38px] w-[38px] -rotate-45 object-contain" />
        </span>
        <div className="flex flex-col items-start">
          <h1>
            <img src="/illustrations/triptai-wordmark-day2.svg" alt="TriptAi" className="h-[58px] w-auto" />
          </h1>
          <p className="mt-1 pl-[13px] font-[Arial,Helvetica,sans-serif] text-[19px] leading-none text-[#2b4142]">Plan less. Go more.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-sm rounded-3xl bg-[#36575c]/95 p-6 shadow-2xl ring-1 ring-white/15 backdrop-blur-md sm:p-8"
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
      className="w-full rounded-xl bg-[#ff9f16] py-3 text-[18px] font-bold leading-tight text-[#1f3a40] shadow-[0_0_12px_rgba(255,159,22,0.3)] transition hover:bg-[#ffb04a] hover:shadow-[0_0_16px_rgba(255,159,22,0.4)] disabled:opacity-60"
    >
      {busy ? busyLabel : children}
    </button>
  );
}
