import { useNavigate } from "react-router-dom";

// Equirectangular plot of the Maharashtra forts. The coastline is a polyline through real coastal-town
// coordinates (Dahanu → Mumbai → Alibag → Murud → Harnai → Ratnagiri → Vijaydurg → Malvan → Vengurla), so the
// relative positions are geographically honest without shipping map tiles. Gingee (Tamil Nadu) lies far
// outside this frame and is shown as an inset.
const BOUNDS = { minLng: 72.45, maxLng: 74.75, minLat: 15.7, maxLat: 21.05 };
const W = 460;
const H = 620;
const project = (lat, lng) => [
  ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * W,
  ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * H,
];

const COAST = [
  [20.95, 72.84], [20.38, 72.83], [19.98, 72.73], [19.7, 72.75], [19.27, 72.81], [18.95, 72.82],
  [18.64, 72.87], [18.33, 72.96], [18.0, 73.03], [17.81, 73.09], [17.4, 73.2], [16.99, 73.3],
  [16.56, 73.33], [16.06, 73.46], [15.86, 73.63], [15.72, 73.69],
];

const LABEL_LEFT = new Set(["khanderi", "suvarnadurg", "vijaydurg", "sindhudurg"]);

export function FortMap({ forts, active, onHover }) {
  const navigate = useNavigate();
  const inFrame = forts.filter((f) => f.latitude >= BOUNDS.minLat && f.latitude <= BOUNDS.maxLat && f.longitude <= BOUNDS.maxLng);
  const outside = forts.filter((f) => !inFrame.includes(f));
  const coast = COAST.map(([lat, lng]) => project(lat, lng).join(",")).join(" ");
  const sea = `0,0 ${coast} 0,${H}`;

  return (
    <figure className="fort-map" aria-label="युनेस्को दुर्गांचे स्थान दर्शविणारा नकाशा">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="दुर्ग नकाशा">
        <g className="fort-map__grid" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1="0" x2={W} y1={(H / 8) * i} y2={(H / 8) * i} />)}
          {Array.from({ length: 7 }, (_, i) => <line key={`v${i}`} y1="0" y2={H} x1={(W / 6) * i} x2={(W / 6) * i} />)}
        </g>
        <polygon className="fort-map__sea" points={sea} aria-hidden="true" />
        <polyline className="fort-map__coast" points={coast} aria-hidden="true" />
        <text className="fort-map__label" x="18" y={H / 2} transform={`rotate(-90 18 ${H / 2})`} textAnchor="middle" aria-hidden="true">अरबी समुद्र</text>
        <text className="fort-map__label" x={W - 16} y="28" textAnchor="end" aria-hidden="true">सह्याद्री ↓</text>

        {inFrame.map((f) => {
          const [x, y] = project(f.latitude, f.longitude);
          const left = LABEL_LEFT.has(f.slug);
          const isActive = active === f.slug;
          return (
            <g
              key={f.slug}
              className={`fort-map__pin ${isActive ? "is-active" : ""}`}
              transform={`translate(${x} ${y})`}
              tabIndex={0}
              role="link"
              aria-label={`${f.name_mr} — ${f.location_mr}`}
              onMouseEnter={() => onHover?.(f.slug)}
              onMouseLeave={() => onHover?.(null)}
              onFocus={() => onHover?.(f.slug)}
              onBlur={() => onHover?.(null)}
              onClick={() => navigate(`/forts/${f.slug}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/forts/${f.slug}`)}
            >
              <circle className="ring" r="10" />
              <circle className="dot" r="5" />
              <text x={left ? -14 : 14} y="4" textAnchor={left ? "end" : "start"}>{f.name_mr}</text>
            </g>
          );
        })}
      </svg>
      {outside.length > 0 && (
        <figcaption className="fort-map__note">
          {outside.map((f) => `${f.name_mr} (${f.state || f.location_mr})`).join(", ")} — नकाशाच्या आग्नेयेस, दक्षिण भारतात.
        </figcaption>
      )}
    </figure>
  );
}
