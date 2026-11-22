import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plane } from "lucide-react";

// Shown while an itinerary is being generated: a white circle with two soft clouds and a plane
// that blasts off out of the top of it over and over,
// with little four-point "Ai" sparkles twinkling around it, and one line of text, on the same
// pale aqua as the sign-in screen.

// One takeoff, repeated: things settle in (first 20%), wait a beat, then the plane speeds up and out
// of the top while the clouds part (last 50%). The plane and both clouds share this timing.
const BLAST = { duration: 2.6, times: [0, 0.2, 0.5, 1], ease: ["easeOut", "linear", "easeIn"], repeat: Infinity };

// Our cloud artwork as a mask, so it can be painted any color
const CLOUD_MASK = {
  WebkitMaskImage: "url(/illustrations/cloud.png)",
  maskImage: "url(/illustrations/cloud.png)",
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
};

// Four-point sparkle, like the stars in the logo (24x24 box)
const SPARKLE = "M12 0 C12.6 6.5 17.5 11.4 24 12 C17.5 12.6 12.6 17.5 12 24 C11.4 17.5 6.5 12.6 0 12 C6.5 11.4 11.4 6.5 12 0 Z";

// Where each sparkle sits around the circle (percent of the box), its size and when it twinkles
const SPARKLES = [
  { left: 82, top: 8, size: 22, delay: 0 },
  { left: 96, top: 52, size: 13, delay: 0.7 },
  { left: 76, top: 90, size: 17, delay: 1.4 },
  { left: 14, top: 86, size: 12, delay: 0.35 },
  { left: 2, top: 40, size: 19, delay: 1.05 },
  { left: 22, top: 4, size: 11, delay: 1.75 },
];

function Sparkle({ left, top, size, delay }) {
  // The outer span centers the sparkle on its spot; the inner svg twinkles (its own transform)
  return (
    <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
      <motion.svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className="block text-coral-500"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
        transition={{ duration: 2.1, delay, ease: "easeInOut", repeat: Infinity }}
      >
        <path d={SPARKLE} fill="currentColor" />
      </motion.svg>
    </span>
  );
}
export default function GeneratingScreen() {
  return (
    <div className="relative flex min-h-screen flex-col bg-page text-ink-800">
      <div className="px-6 pt-6 md:px-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-800/80 transition hover:bg-white/50 hover:text-ink-800"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        {/* A white circle with a plane blasting off over two clouds, and gold sparkles twinkling
            around it */}
        <div className="relative mb-8 h-44 w-44" aria-hidden="true">
          <span className="absolute inset-10 overflow-hidden rounded-full bg-white shadow-sm">
            {/* Two soft dark green clouds peeking up from the bottom of the circle. As the plane blasts
                off they part, one sliding out to the left and the other to the right, then drift back
                in for the next takeoff. */}
            <motion.span
              className="absolute -bottom-3 -left-3 aspect-[1200/756] w-[70%] bg-[#2d625e]"
              style={CLOUD_MASK}
              animate={{ x: ["0%", "0%", "0%", "-115%"], opacity: [0, 0.4, 0.4, 0.4] }}
              transition={BLAST}
            />
            <motion.span
              className="absolute -bottom-4 -right-4 aspect-[1200/756] w-[62%] bg-[#2d625e]"
              style={{ ...CLOUD_MASK, scaleX: -1 }}
              animate={{ x: ["0%", "0%", "0%", "125%"], opacity: [0, 0.4, 0.4, 0.4] }}
              transition={BLAST}
            />
            {/* The plane, nose up, blasting off over and over: it fades in at the middle, waits a
                beat, then speeds up and out through the top of the circle (which hides it) */}
            <motion.span
              className="absolute inset-0 flex items-center justify-center"
              animate={{ y: [10, 0, 0, -90], opacity: [0, 1, 1, 1] }}
              transition={BLAST}
            >
              <Plane size={44} className="-rotate-45 text-ink-800" fill="currentColor" />
            </motion.span>
          </span>
          {SPARKLES.map((s) => (
            <Sparkle key={`${s.left}-${s.top}`} {...s} />
          ))}
        </div>

        <h1 className="max-w-md text-2xl font-extrabold tracking-tight text-ink-800 md:text-3xl">
          Now you can relax while I'm making the perfect plan...
        </h1>
      </div>
    </div>
  );
}
