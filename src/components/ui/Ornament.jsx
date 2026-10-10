// Mandala ornament echoing the texture inside the Durgotsav logo disc. Pure SVG, inherits currentColor.
const petals = (count, r, len, w) =>
  Array.from({ length: count }, (_, i) => (
    <path
      key={i}
      transform={`rotate(${(360 / count) * i})`}
      d={`M0 ${-r} C ${w} ${-r - len * 0.35}, ${w} ${-r - len * 0.75}, 0 ${-r - len} C ${-w} ${-r - len * 0.75}, ${-w} ${-r - len * 0.35}, 0 ${-r} Z`}
    />
  ));

export function Mandala({ className, spin = false }) {
  return (
    <svg className={className} viewBox="-200 -200 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <g className={spin ? "mandala-spin" : undefined}>
        <circle r="196" />
        <circle r="186" strokeDasharray="2 6" />
        <g>{petals(24, 140, 44, 9)}</g>
        <circle r="138" />
        <g>{petals(16, 92, 44, 13)}</g>
        <circle r="90" />
        <circle r="78" strokeDasharray="1 5" />
        <g>{petals(12, 30, 46, 11)}</g>
        <circle r="28" />
        <circle r="10" />
      </g>
    </svg>
  );
}

// Small divider used between headings and body copy
export function Divider({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 16" width="200" height="16" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M0 8h78M122 8h78" strokeWidth="1" />
      <path d="M100 1l7 7-7 7-7-7z" fill="currentColor" stroke="none" />
      <circle cx="84" cy="8" r="2" fill="currentColor" stroke="none" />
      <circle cx="116" cy="8" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
