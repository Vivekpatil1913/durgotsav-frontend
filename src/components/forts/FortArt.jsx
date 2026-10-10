import { useId } from "react";

// Illustrated duotone scene used when a fort has no photograph yet: a ridge (hill), forested ridge,
// headland (coastal) or island, crowned with bastions and a भगवा flag. `variant` shifts sun & ridges.
const PALETTES = [
  ["#2a1b10", "#7a3d12", "#f3923a"],
  ["#1c120a", "#5a3a1e", "#f2b13a"],
  ["#14100c", "#3d4a2c", "#e8781e"],
  ["#1a1410", "#2f4b55", "#f7d58c"],
];

function Bastions({ x, y, w }) {
  const towers = 4;
  const step = w / (towers - 1);
  return (
    <g fill="#120b06">
      <rect x={x} y={y} width={w} height={14} />
      {Array.from({ length: towers }, (_, i) => (
        <g key={i}>
          <rect x={x + i * step - 7} y={y - 10} width={14} height={24} rx={2} />
          <rect x={x + i * step - 9} y={y - 14} width={4} height={5} />
          <rect x={x + i * step - 2} y={y - 14} width={4} height={5} />
          <rect x={x + i * step + 5} y={y - 14} width={4} height={5} />
        </g>
      ))}
      <line x1={x + w / 2} y1={y - 14} x2={x + w / 2} y2={y - 48} stroke="#120b06" strokeWidth="2" />
      <path d={`M${x + w / 2} ${y - 48} l22 7 -22 7z`} fill="#e8781e" />
    </g>
  );
}

export function FortArt({ type = "hill", variant = 0, title, className }) {
  const id = useId().replace(/:/g, "");
  const [deep, mid, glow] = PALETTES[variant % PALETTES.length];
  const sunX = 90 + ((variant * 53) % 220);
  const water = type === "coastal" || type === "island";

  return (
    <svg className={className} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={deep} />
          <stop offset="0.65" stopColor={mid} />
          <stop offset="1" stopColor={glow} />
        </linearGradient>
        <radialGradient id={`sun${id}`}>
          <stop offset="0" stopColor="#fff3d6" />
          <stop offset="0.35" stopColor={glow} stopOpacity="0.9" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#sky${id})`} />
      <circle cx={sunX} cy={water ? 190 : 170} r="70" fill={`url(#sun${id})`} />
      <circle cx={sunX} cy={water ? 190 : 170} r="16" fill="#fff3d6" opacity="0.9" />

      {!water && (
        <>
          <path d="M0 210 L60 170 L110 190 L170 140 L230 175 L290 150 L350 180 L400 160 V300 H0Z" fill="#000" opacity="0.25" />
          <path d="M0 240 L70 200 L130 150 L175 112 L225 112 L270 160 L330 205 L400 220 V300 H0Z" fill="#120b06" opacity="0.92" />
          <Bastions x={168} y={104} w={64} />
          {type === "hill-forest" &&
            Array.from({ length: 14 }, (_, i) => {
              const x = 10 + i * 28;
              const y = 250 - (i % 3) * 8;
              return <path key={i} d={`M${x} ${y} l12 -34 l12 34z`} fill="#0d0804" />;
            })}
          <path d="M0 262 Q100 245 200 262 T400 258 V300 H0Z" fill="#0d0804" />
        </>
      )}

      {water && (
        <>
          <rect y="205" width="400" height="95" fill="#0d0804" opacity="0.85" />
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} d={`M${-20 + (i % 2) * 30} ${222 + i * 12} q25 -6 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0`}
              stroke={glow} strokeOpacity={0.35 - i * 0.04} strokeWidth="1.5" fill="none" />
          ))}
          {type === "coastal" ? (
            <>
              <path d="M0 205 L0 150 L60 140 L130 158 L170 175 L190 205Z" fill="#120b06" />
              <Bastions x={40} y={136} w={70} />
            </>
          ) : (
            <>
              <path d="M140 207 Q200 186 260 207Z" fill="#120b06" />
              <rect x="150" y="182" width="100" height="25" fill="#120b06" />
              <Bastions x={152} y={176} w={96} />
            </>
          )}
        </>
      )}
    </svg>
  );
}
