/**
 * 3.4 擊球落點與強勁程度場地圖
 * Fan-shaped baseball field diagram with hit points colored by exit velocity.
 * Uses inline SVG (no d3 dependency).
 */

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

// ---------- Types ----------
interface HitPoint {
  /** angle in degrees: 0 = center, negative = pull (left), positive = oppo (right) */
  angle: number;
  /** distance in metres */
  distance: number;
  /** exit velocity in km/h */
  exitVelo: number;
}

// ---------- Mock data generator ----------
function generateMockHits(count: number): HitPoint[] {
  const seed = 42;
  const rng = (i: number) => {
    const x = Math.sin(seed + i * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  return Array.from({ length: count }, (_, i) => {
    const r1 = rng(i);
    const r2 = rng(i + count);
    const r3 = rng(i + count * 2);

    // Pull-side bias: slightly more negative angles
    const angle = (r1 - 0.55) * 100; // roughly -55 to +45
    // Distance: clustered 20-110m with some outliers
    const distance = 15 + r2 * 110;
    // Exit velo: 80-170 km/h, skewed toward mid-range
    const exitVelo = 80 + r3 * 90;

    return { angle, distance, exitVelo };
  });
}

// ---------- Helpers ----------
const DEG = Math.PI / 180;
const FAN_HALF = 60; // half of 120 degree fan
const ARCS = [30, 60, 90, 120]; // distance arcs in metres
const MAX_DIST = 130; // max distance for scaling

function polarToXY(
  angleDeg: number,
  distMetres: number,
  cx: number,
  cy: number,
  scale: number,
): [number, number] {
  // 0 degrees = straight up (center field), negative = left (pull), positive = right (oppo)
  const rad = (angleDeg - 90) * DEG;
  const r = (distMetres / MAX_DIST) * scale;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function hitColor(velo: number): string {
  if (velo > 152.9) return "#ef4444"; // red - strong
  if (velo >= 120) return "#eab308"; // yellow - medium
  return "#3b82f6"; // blue - weak
}

function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToXY(startAngle, MAX_DIST, cx, cy, radius / (MAX_DIST / MAX_DIST));
  // Re-compute using raw trig for the arc path
  const r = radius;
  const sRad = (startAngle - 90) * DEG;
  const eRad = (endAngle - 90) * DEG;
  const sx = cx + r * Math.cos(sRad);
  const sy = cy + r * Math.sin(sRad);
  const ex = cx + r * Math.cos(eRad);
  const ey = cy + r * Math.sin(eRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`;
}

// ---------- Component ----------
export default function FieldHitChart() {
  const hits = useMemo(() => generateMockHits(30), []);

  const W = 500;
  const H = 400;
  const CX = W / 2;
  const CY = H - 40; // batter position near bottom
  const SCALE = 280; // pixel radius for MAX_DIST

  const scaleR = (d: number) => (d / MAX_DIST) * SCALE;

  // Diamond (bases) - small diamond near home
  const baseSize = scaleR(27.43); // 90 feet ~ 27.43 m
  const diamondPoints = [
    [CX, CY], // home
    [CX - baseSize * 0.7, CY - baseSize * 0.7], // 3rd
    [CX, CY - baseSize * 1.4], // 2nd
    [CX + baseSize * 0.7, CY - baseSize * 0.7], // 1st
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  return (
    <div className="space-y-3">
      <Badge variant="secondary" className="text-[10px]">模擬數據</Badge>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto h-64 w-full max-w-lg"
        role="img"
        aria-label="擊球落點場地圖"
      >
        {/* Background */}
        <rect width={W} height={H} fill="transparent" />

        {/* Fan-shaped field outline */}
        {(() => {
          const sRad = (-FAN_HALF - 90) * DEG;
          const eRad = (FAN_HALF - 90) * DEG;
          const r = SCALE;
          const sx = CX + r * Math.cos(sRad);
          const sy = CY + r * Math.sin(sRad);
          const ex = CX + r * Math.cos(eRad);
          const ey = CY + r * Math.sin(eRad);
          return (
            <path
              d={`M ${CX} ${CY} L ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey} Z`}
              fill="rgba(34,197,94,0.08)"
              stroke="rgba(34,197,94,0.3)"
              strokeWidth={1}
            />
          );
        })()}

        {/* Distance arcs */}
        {ARCS.map((dist) => {
          const r = scaleR(dist);
          const sRad = (-FAN_HALF - 90) * DEG;
          const eRad = (FAN_HALF - 90) * DEG;
          const sx = CX + r * Math.cos(sRad);
          const sy = CY + r * Math.sin(sRad);
          const ex = CX + r * Math.cos(eRad);
          const ey = CY + r * Math.sin(eRad);
          return (
            <g key={dist}>
              <path
                d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`}
                fill="none"
                stroke="rgba(156,163,175,0.3)"
                strokeWidth={0.8}
                strokeDasharray="4 3"
              />
              {/* Label */}
              <text
                x={CX + 6}
                y={CY - r + 12}
                fill="rgba(156,163,175,0.6)"
                fontSize={10}
                textAnchor="start"
              >
                {dist}m
              </text>
            </g>
          );
        })}

        {/* Center line (0 degrees) */}
        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - SCALE}
          stroke="rgba(156,163,175,0.4)"
          strokeWidth={0.8}
          strokeDasharray="6 4"
        />

        {/* Foul lines */}
        {[-FAN_HALF, FAN_HALF].map((ang) => {
          const rad = (ang - 90) * DEG;
          return (
            <line
              key={ang}
              x1={CX}
              y1={CY}
              x2={CX + SCALE * Math.cos(rad)}
              y2={CY + SCALE * Math.sin(rad)}
              stroke="rgba(156,163,175,0.25)"
              strokeWidth={0.8}
            />
          );
        })}

        {/* Diamond (bases) */}
        <polygon
          points={diamondPoints}
          fill="none"
          stroke="rgba(156,163,175,0.5)"
          strokeWidth={1}
        />

        {/* Home plate marker */}
        <circle cx={CX} cy={CY} r={3} fill="rgba(255,255,255,0.7)" />

        {/* Hit points */}
        {hits.map((hit, i) => {
          const clampedAngle = Math.max(-FAN_HALF, Math.min(FAN_HALF, hit.angle));
          const clampedDist = Math.min(MAX_DIST, Math.max(0, hit.distance));
          const rad = (clampedAngle - 90) * DEG;
          const r = scaleR(clampedDist);
          const x = CX + r * Math.cos(rad);
          const y = CY + r * Math.sin(rad);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4.5}
              fill={hitColor(hit.exitVelo)}
              opacity={0.85}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={0.5}
            >
              <title>
                {`角度: ${hit.angle.toFixed(1)}°, 距離: ${hit.distance.toFixed(1)}m, 初速: ${hit.exitVelo.toFixed(1)} km/h`}
              </title>
            </circle>
          );
        })}

        {/* Pull / Oppo labels */}
        <text x={40} y={CY - SCALE * 0.45} fill="rgba(209,213,219,0.7)" fontSize={13} fontWeight={600}>
          Pull
        </text>
        <text
          x={W - 40}
          y={CY - SCALE * 0.45}
          fill="rgba(209,213,219,0.7)"
          fontSize={13}
          fontWeight={600}
          textAnchor="end"
        >
          Oppo
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
          &gt;152.9 km/h
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
          120–152 km/h
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
          &lt;120 km/h
        </span>
      </div>
    </div>
  );
}
