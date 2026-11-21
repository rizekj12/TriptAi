import React from "react";

// Scrapbook page behind the sign-in screens: dark emerald journal paper (so the frosted, white-
// text sign-in card stays readable) with travel polaroids, stamps, a postmark, a boarding pass
// stub and stickers around the edges. The middle is kept clear for the card. Decorative only.

// Fine paper grain
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

// Washi tape colors (brand palette)
const TAPE = {
  coral: "bg-coral-400/80",
  mango: "bg-mango-300/85",
  aqua: "bg-aqua-300/80",
  orchid: "bg-orchid-300/80",
  azure: "bg-azure-300/85",
};

function Polaroid({ src, caption, tape = "coral", className = "" }) {
  return (
    <figure className={`absolute bg-white p-2 pb-8 shadow-[0_12px_30px_rgba(0,0,0,0.45)] sm:p-2.5 sm:pb-10 ${className}`}>
      <span className={`absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-3 ${TAPE[tape]} sm:w-20`} />
      <img src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
      <figcaption className="absolute inset-x-0 bottom-1 text-center font-hand text-lg leading-none text-slate-700 sm:bottom-1.5 sm:text-2xl">
        {caption}
      </figcaption>
    </figure>
  );
}

// Hand-drawn look: brand ink and paper colors, and a filter that roughens every line so it
// reads as drawn by hand (defined once in <HandDrawnDefs />).
const INK = "#3b615e";
const PAPER = "#fcb878";
const ROUGH = "url(#scrapbook-rough)";
const HAND_FONT = "Caveat, cursive";

function HandDrawnDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <filter id="scrapbook-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="3.5" />
        </filter>
      </defs>
    </svg>
  );
}

// Scalloped (perforated) stamp outline: a rectangle with round bumps along every edge
function scallopPath(w, h, r) {
  let d = `M0 0`;
  for (let x = 0; x < w; x += 2 * r) d += ` a${r} ${r} 0 0 1 ${2 * r} 0`;
  for (let y = 0; y < h; y += 2 * r) d += ` a${r} ${r} 0 0 1 0 ${2 * r}`;
  for (let x = w; x > 0; x -= 2 * r) d += ` a${r} ${r} 0 0 1 ${-2 * r} 0`;
  for (let y = h; y > 0; y -= 2 * r) d += ` a${r} ${r} 0 0 1 0 ${-2 * r}`;
  return d + " Z";
}

// Hand-drawn postage stamp. `inverted` swaps ink and paper (green stamp, peach ink).
function Stamp({ className = "", value = "45¢", label = "AIR MAIL", art = "/illustrations/plane-mark.png", inverted = false }) {
  const paper = inverted ? INK : PAPER;
  const ink = inverted ? PAPER : INK;
  return (
    <svg viewBox="-6 -6 108 124" className={`absolute drop-shadow-[0_8px_14px_rgba(0,0,0,0.4)] ${className}`} aria-hidden="true">
      <g filter={ROUGH}>
        <path d={scallopPath(96, 112, 4)} fill={paper} stroke={ink} strokeWidth="1.5" />
        {/* Double-traced inner frame, like a pen going round twice */}
        <rect x="9" y="9" width="78" height="94" rx="3" fill="none" stroke={ink} strokeWidth="2" />
        <rect x="10.5" y="8" width="76" height="96" rx="4" fill="none" stroke={ink} strokeWidth="1" opacity="0.55" />
      </g>
      <image href={art} x="26" y="26" width="44" height="50" preserveAspectRatio="xMidYMid meet" />
      <text x="82" y="26" textAnchor="end" fontFamily={HAND_FONT} fontSize="17" fontWeight="700" fill={ink}>
        {value}
      </text>
      <text x="48" y="96" textAnchor="middle" fontFamily={HAND_FONT} fontSize="15" fontWeight="700" letterSpacing="1.5" fill={ink}>
        {label}
      </text>
    </svg>
  );
}

// Round ink postmark with wavy cancellation lines
function Postmark({ className = "" }) {
  return (
    <svg viewBox="0 0 220 120" className={`absolute ${className}`} fill="none" stroke="currentColor">
      <defs>
        <path id="postmark-ring" d="M60 60 m-40 0 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0" />
      </defs>
      <circle cx="60" cy="60" r="50" strokeWidth="3" />
      <circle cx="60" cy="60" r="31" strokeWidth="2" />
      <text fill="currentColor" stroke="none" fontSize="12" fontWeight="800" letterSpacing="2.5">
        <textPath href="#postmark-ring">TRIPTAI · AIR MAIL · BON VOYAGE ·</textPath>
      </text>
      <text x="60" y="65" fill="currentColor" stroke="none" fontSize="15" fontWeight="900" textAnchor="middle">
        2026
      </text>
      <g strokeWidth="3.5" strokeLinecap="round">
        <path d="M118 42 q12 -8 24 0 t24 0 t24 0 t24 0" />
        <path d="M118 60 q12 -8 24 0 t24 0 t24 0 t24 0" />
        <path d="M118 78 q12 -8 24 0 t24 0 t24 0 t24 0" />
      </g>
    </svg>
  );
}

// Hand-drawn boarding pass: peach paper, green ink, a dashed tear line and a handwritten stub
function BoardingPass({ className = "" }) {
  return (
    <svg viewBox="-4 -4 268 118" className={`absolute drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)] ${className}`} aria-hidden="true">
      <g filter={ROUGH}>
        <rect x="0" y="0" width="260" height="110" rx="12" fill={PAPER} stroke={INK} strokeWidth="2" />
        <rect x="2" y="-1.5" width="257" height="112" rx="13" fill="none" stroke={INK} strokeWidth="1" opacity="0.5" />
        {/* Tear line and notches */}
        <path d="M200 8 V102" stroke={INK} strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" />
        <circle cx="200" cy="0" r="7" fill="#1a4343" />
        <circle cx="200" cy="110" r="7" fill="#1a4343" />
        {/* Flight path doodle */}
        <path d="M70 58 q35 -26 70 0" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round" />
      </g>
      <text x="16" y="24" fontFamily={HAND_FONT} fontSize="15" fontWeight="700" letterSpacing="2" fill={INK}>
        BOARDING PASS
      </text>
      <text x="16" y="70" fontFamily={HAND_FONT} fontSize="34" fontWeight="700" fill={INK}>
        LAX
      </text>
      <image href="/illustrations/plane-mark.png" x="93" y="38" width="22" height="24" transform="rotate(90 104 50)" />
      <text x="138" y="70" fontFamily={HAND_FONT} fontSize="34" fontWeight="700" fill={INK}>
        NRT
      </text>
      <text x="16" y="96" fontFamily={HAND_FONT} fontSize="15" fill={INK}>
        Gate 42 · Seat 12A · 9:40
      </text>
      <text x="234" y="55" textAnchor="middle" fontFamily={HAND_FONT} fontSize="17" fontWeight="700" letterSpacing="2" fill={INK} transform="rotate(90 230 55)">
        TRIPTAI
      </text>
    </svg>
  );
}

function Label({ children, className = "" }) {
  return (
    <span className={`absolute rounded-full border-[3px] border-white px-4 py-1.5 font-hand text-2xl font-bold leading-none text-white shadow-[0_8px_18px_rgba(0,0,0,0.35)] ${className}`}>
      {children}
    </span>
  );
}

export default function ScrapbookBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-page">
      <HandDrawnDefs />
      {/* Paper: soft lighting, journal dots and grain */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,186,128,0.12),transparent_65%)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#fff_1px,transparent_1.2px)] [background-size:26px_26px]" />
      <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />

      {/* Hand-drawn dashed flight path, stretched across the whole page: in from the left edge near
          the bottom, looping up to the very top-right corner */}
      <img src="/illustrations/flight-path.png" alt="" className="absolute inset-0 hidden h-full w-full object-fill md:block" />

      {/* Polaroids: corners on phones, more around the edges on bigger screens */}
      <Polaroid src="/illustrations/sketches/greece-green.jpg" caption="Greece ☀" tape="aqua" className="-left-6 -top-6 w-32 -rotate-[9deg] sm:left-[3%] sm:top-[5%] sm:w-48 lg:w-56" />
      <Polaroid src="/illustrations/sketches/iceland-green.jpg" caption="Iceland" tape="mango" className="-right-6 -top-4 w-32 rotate-[8deg] sm:right-[4%] sm:top-[7%] sm:w-48 lg:w-52" />
      <Polaroid src="/illustrations/sketches/japan-green.jpg" caption="Tokyo nights" tape="orchid" className="-bottom-8 -left-5 w-32 rotate-[6deg] sm:bottom-[6%] sm:left-[6%] sm:w-48 lg:w-56" />
      <Polaroid src="/illustrations/sketches/mexico-green.jpg" caption="Mexico ✨" tape="coral" className="-bottom-6 -right-6 w-32 -rotate-[5deg] sm:bottom-[5%] sm:right-[7%] sm:w-48 lg:w-52" />
      <Polaroid src="/illustrations/sketches/portugal-green.jpg" caption="Lisbon" tape="azure" className="left-[-2%] top-[40%] hidden w-44 rotate-[5deg] md:block lg:w-48" />
      <Polaroid src="/illustrations/sketches/puerto-rico-green.jpg" caption="San Juan" tape="mango" className="right-[-1%] top-[42%] hidden w-44 -rotate-[7deg] md:block lg:w-48" />

      {/* Stamps and postmark */}
      <Stamp className="left-[19%] top-[28%] hidden w-24 rotate-[10deg] lg:block" />
      <Postmark className="left-[21%] top-[33%] hidden w-44 -rotate-[8deg] text-white/45 lg:block" />
      <Stamp className="bottom-[30%] right-[20%] hidden w-24 -rotate-[8deg] lg:block" value="1.20" label="PAR AVION" art="/illustrations/pine-tree.png" inverted />

      {/* Boarding pass stub */}
      <BoardingPass className="bottom-[22%] left-[17%] hidden w-64 -rotate-[4deg] xl:block" />
      {/* Location pin standing on top of the boarding pass, its tip just touching the ticket */}
      <img src="/illustrations/pin.png" alt="" className="absolute bottom-[calc(22%+113px)] left-[calc(17%+108px)] hidden h-14 w-auto rotate-[-8deg] xl:block" />

      {/* Stickers */}
      {/* Our cloud and pine trees, at the same 54% opacity as on the quiz page */}
      <img src="/illustrations/cloud.png" alt="" className="absolute right-[24%] top-[8%] hidden w-32 opacity-[0.54] md:block lg:w-40" />
      <div className="absolute bottom-0 right-[33%] hidden items-end gap-1.5 opacity-[0.54] md:flex">
        <img src="/illustrations/pine-tree.png" alt="" className="h-28 w-auto lg:h-32" />
        <img src="/illustrations/pine-tree.png" alt="" className="h-20 w-auto lg:h-[5.5rem]" />
      </div>
      <img src="/illustrations/sparkles.png" alt="" className="absolute right-[26%] top-[60%] hidden h-16 w-auto xl:block" />
      <Label className="left-[24%] top-[13%] hidden -rotate-[8deg] bg-coral-500 lg:block">Bon voyage!</Label>
      <Label className="bottom-[13%] right-[20%] hidden rotate-[5deg] bg-mango-400 text-slate-900 lg:block">Wish you were here</Label>
    </div>
  );
}
