// Filled orange feature icons used in the hero (match the reference design's icon style).
const GRAD = (
  <defs>
    <linearGradient id="hero-ico" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffa040" />
      <stop offset="1" stopColor="#e85a10" />
    </linearGradient>
  </defs>
);

export function FortIcon(props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      {GRAD}
      <path fill="url(#hero-ico)" d="M4 44V24h4v-5h3v5h4V15h4v-4h2V5h2v6h2v4h4v9h4v-5h3v5h4v20H29V34a5 5 0 0 0-10 0v10Z" />
      <path fill="url(#hero-ico)" d="M23 1h1.6v3.2L31 6l-6.4 1.8V9H23Z" />
    </svg>
  );
}

export function ColumnsIcon(props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      {GRAD}
      <path fill="url(#hero-ico)" d="M24 3 44 13v4H4v-4Zm-18 16h36v3H6Zm2 5h5v14H8Zm9 0h5v14h-5Zm9 0h5v14h-5Zm9 0h5v14h-5ZM5 40h38v3H5Zm-2 4h42v3H3Z" />
    </svg>
  );
}

// Maharashtra outline from approximate border coordinates (lat, lng), projected into the 48×48 box.
const MH = [
  [20.15, 72.75], [20.7, 73.3], [21.1, 73.6], [21.7, 74.1], [22.0, 74.4], [21.4, 75.2], [21.4, 76.0], [21.7, 76.5],
  [21.5, 77.2], [21.8, 78.0], [21.5, 78.6], [21.7, 79.3], [21.6, 80.0], [21.4, 80.6], [20.9, 80.9], [20.0, 80.6],
  [19.3, 80.3], [18.75, 80.25], [19.2, 79.3], [19.5, 78.3], [19.1, 77.8], [18.6, 77.6], [18.1, 77.3], [17.6, 76.5],
  [17.3, 76.2], [16.9, 75.0], [16.3, 74.4], [15.8, 74.2], [15.6, 73.8], [16.0, 73.45], [16.6, 73.33], [17.0, 73.3],
  [17.8, 73.1], [18.3, 72.95], [18.9, 72.8], [19.3, 72.8], [20.0, 72.73],
];
const MH_PATH = (() => {
  const s = 44 / (81 - 72.6);
  const h = (22.1 - 15.5) * s;
  const oy = (48 - h) / 2;
  return MH.map(([lat, lng], i) => `${i ? "L" : "M"}${(2 + (lng - 72.6) * s).toFixed(1)} ${(oy + (22.1 - lat) * s).toFixed(1)}`).join(" ") + "Z";
})();

export function MaharashtraIcon(props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      {GRAD}
      <path d={MH_PATH} fill="none" stroke="url(#hero-ico)" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  );
}

export function PeopleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      {GRAD}
      <g fill="url(#hero-ico)">
        <circle cx="24" cy="11" r="6" />
        <path d="M14 42V27a10 10 0 0 1 20 0v15Z" />
        <circle cx="10" cy="15" r="4.5" />
        <path d="M2 42V30a8 8 0 0 1 10.5-7.6A13 13 0 0 0 11 27v15Z" />
        <circle cx="38" cy="15" r="4.5" />
        <path d="M46 42V30a8 8 0 0 0-10.5-7.6A13 13 0 0 1 37 27v15Z" />
      </g>
    </svg>
  );
}
