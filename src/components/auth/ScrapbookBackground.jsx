import React from "react";

// Background behind the sign-in screens: a pale aqua sky with two big near-white clouds off the
// top corners, a glowing peach sun in front of the right one, a small slate plane flying past it, two
// palm trees in the bottom-left corner and a slate hill along the bottom. Decorative only.

const SKY = "#cdeae8";
const CLOUD = "#e8f6f5";
const SUN = "#ff9f16";
const HILL = "#4a605e";
const SLATE = "#4a605e";

// Paints one of our transparent PNGs in a flat color (the element's background)
const maskOf = (src) => ({
  WebkitMaskImage: `url(${src})`,
  maskImage: `url(${src})`,
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
});

// One feathery palm frond: a leaf that follows a curve from the crown to its tip, tapering at
// both ends, with a saw-toothed lower edge so it reads as separate leaflets.
function frond([x0, y0], [cx, cy], [x1, y1], width) {
  const steps = 16;
  const top = [];
  const bottom = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = width * Math.pow(Math.sin(Math.PI * Math.min(t, 0.97)), 0.7);
    const tooth = i % 2 ? 1.9 : 0.5;
    top.push(`${(x + nx * w * 0.45).toFixed(1)} ${(y + ny * w * 0.45).toFixed(1)}`);
    bottom.push(`${(x - nx * w * tooth).toFixed(1)} ${(y - ny * w * tooth).toFixed(1)}`);
  }
  return `M${top.join(" L")} L${bottom.reverse().join(" L")} Z`;
}

const CROWN = [98, 62];
const PALM_FRONDS = [
  [[52, 30], [8, 92], 15],
  [[146, 30], [192, 90], 15],
  [[60, 62], [26, 136], 14],
  [[140, 64], [172, 138], 14],
  [[74, 18], [40, 6], 12],
  [[124, 16], [160, 8], 12],
  [[100, 30], [104, 0], 7],
].map(([c, tip, w]) => frond(CROWN, c, tip, w));

// Palm tree silhouette: a gently leaning trunk under a crown of fronds
function PalmTree({ className = "", flip = false }) {
  return (
    <svg viewBox="0 0 200 300" className={`absolute ${className}`} style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <g fill={SLATE}>
        <path d="M88 300 C92 230 108 150 92 64 L104 62 C122 150 108 230 106 300 Z" />
        {PALM_FRONDS.map((d, i) => (
          <path key={i} d={d} />
        ))}
        <circle cx="96" cy="70" r="6" />
        <circle cx="105" cy="72" r="5" />
      </g>
    </svg>
  );
}

export default function ScrapbookBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ backgroundColor: SKY }}>
      {/* Clouds hanging off the top-left and top-right corners */}
      <div className="absolute -left-[10%] -top-[4%] aspect-[1200/756] w-[52vw] sm:w-[40vw]" style={{ ...maskOf("/illustrations/cloud.png"), backgroundColor: CLOUD }} />
      <div className="absolute -top-[12%] right-0 aspect-[1200/756] w-[60vw] translate-x-[56%] sm:w-[50vw]" style={{ ...maskOf("/illustrations/cloud.png"), backgroundColor: CLOUD }} />
      {/* Glowing sun in front of the right cloud, on its upper-left shoulder (hidden on phone-size screens) */}
      <div className="absolute right-[10%] top-[6%] hidden aspect-square w-[11vw] rounded-full sm:block" style={{ backgroundColor: SUN, boxShadow: "0 0 18px 4px rgba(255,159,22,0.3)" }} />
      {/* Small plane flying just left of the right cloud, nose up and to the right */}
      <div className="absolute right-[23.5%] top-[31%] hidden aspect-[1231/1400] w-[6.8vw] rotate-[44deg] sm:block" style={{ ...maskOf("/illustrations/plane-sparkles-solid.png"), backgroundColor: SLATE }} />

      {/* Two palm trees in the bottom-left corner, trunks running down behind the hill */}
      <PalmTree className="bottom-0 left-[1%] h-[min(46vh,44vw)] w-auto" />
      <PalmTree className="bottom-[3%] left-[min(17vw,26vh)] h-[min(28vh,27vw)] w-auto" flip />

      {/* Slate hill along the bottom, rising toward the right */}
      <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[15%] w-full">
        <path d="M0 100 C160 45 460 30 700 26 C850 22 950 12 1000 0 V100 Z" fill={HILL} />
      </svg>
    </div>
  );
}
