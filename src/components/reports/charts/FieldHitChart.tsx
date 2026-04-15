/**
 * 3.4 擊球落點與強勁程度場地圖
 * 依真實棒球場比例繪製：
 * - 本壘 90° 界外線（±45°）
 * - 左右外野 99m 全壘打牆、中外野 122m
 * - 內野為正方形（壘距 27.43m、home→2nd 38.79m）
 * - 本壘到投手板 18.39m
 * - 擊球落點依初速分級著色，滑鼠懸停顯示詳情
 */

import { useMemo, useState } from "react";

// ───────── 真實場地尺寸（公尺） ─────────
const LF_RF_DISTANCE = 99;   // 左右外野全壘打距離
const CF_DISTANCE = 122;     // 中外野全壘打距離
const BASE_DISTANCE = 27.43; // 壘與壘之間
const HOME_TO_2ND = 38.79;   // 本壘到 2 壘
const PITCHER_DISTANCE = 18.39; // 本壘到投手板
const FOUL_HALF_ANGLE_DEG = 45; // 界外線半角（總角 90°）

const DEG = Math.PI / 180;

// ───────── Types ─────────
interface HitPoint {
  id: number;
  /** 角度：0=中外野，負=左外野方向（Pull for 右打），正=右外野方向 */
  angle: number;
  /** 飛行距離（公尺） */
  distance: number;
  /** 擊球初速 (km/h) */
  exitVelo: number;
  /** 擊球仰角（°） */
  launchAngle: number;
}

// ───────── Mock Data ─────────
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
    const r4 = rng(i + count * 3);

    // -45° ~ +45°（界內），微偏 Pull
    const angle = (r1 - 0.55) * 85;
    const distance = 15 + r2 * 110;
    const exitVelo = 80 + r3 * 90;
    const launchAngle = -10 + r4 * 50;

    return { id: i, angle, distance, exitVelo, launchAngle };
  });
}

// ───────── 強度分級 ─────────
function hitColor(velo: number): string {
  if (velo > 152.9) return "#ef4444";
  if (velo >= 120) return "#eab308";
  return "#3b82f6";
}
function hitCategory(velo: number): string {
  if (velo > 152.9) return "強勁 (>152.9 km/h)";
  if (velo >= 120) return "中等 (120–152 km/h)";
  return "偏弱 (<120 km/h)";
}

// ───────── 仰角分類（參考 Statcast / 棒球通用分類） ─────────
function launchAngleCategory(la: number): string {
  if (la < 10) return `滾地/平飛 (${la.toFixed(1)}°)`;
  if (la < 25) return `平飛 Line Drive (${la.toFixed(1)}°)`;
  if (la < 50) return `高飛 Fly Ball (${la.toFixed(1)}°)`;
  return `高拋 Pop Up (${la.toFixed(1)}°)`;
}

// ───────── 座標轉換（以本壘為原點、中外野為 +Y） ─────────
/** 極座標 → 場地座標（本壘=0, 中外野=+distance） */
function polarToField(angleDeg: number, distM: number) {
  const rad = angleDeg * DEG;
  return { x: distM * Math.sin(rad), y: distM * Math.cos(rad) };
}

// ───────── Component ─────────
export default function FieldHitChart() {
  const hits = useMemo(() => generateMockHits(30), []);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null);

  // viewBox 以公尺為單位（左右預留空間給 Pull/Oppo 標籤）
  const PAD = 32;
  const VB_X = -(LF_RF_DISTANCE + PAD);
  const VB_W = (LF_RF_DISTANCE + PAD) * 2;
  const VB_Y = -PAD;
  const VB_H = CF_DISTANCE + PAD * 2;

  // 外野圓弧（通過左 foul pole、中外野、右 foul pole）
  // 以對稱性：圓心在 y 軸上，解聯立得 k = 48.88, r ≈ 73.12
  const leftPole = polarToField(-FOUL_HALF_ANGLE_DEG, LF_RF_DISTANCE);
  const rightPole = polarToField(FOUL_HALF_ANGLE_DEG, LF_RF_DISTANCE);
  const centerPole = { x: 0, y: CF_DISTANCE };
  // 解 (±70)² + (70 - k)² = (122 - k)²
  const k =
    (centerPole.y * centerPole.y - (leftPole.x ** 2 + leftPole.y ** 2)) /
    (2 * (centerPole.y - leftPole.y));
  const arcR = centerPole.y - k;

  // 內野四角
  const first = polarToField(FOUL_HALF_ANGLE_DEG, BASE_DISTANCE);
  const second = polarToField(0, HOME_TO_2ND);
  const third = polarToField(-FOUL_HALF_ANGLE_DEG, BASE_DISTANCE);
  const mound = polarToField(0, PITCHER_DISTANCE);

  /**
   * SVG 座標系：x 同向、y 向下。場地座標 +Y 是中外野，SVG 需往上（負 y），
   * 因此：svgY = -fieldY。所有繪製點做這個轉換。
   */
  const toSvg = (pt: { x: number; y: number }) => ({ x: pt.x, y: -pt.y });

  const L = toSvg(leftPole);
  const R = toSvg(rightPole);
  const C = toSvg(centerPole);
  const H = toSvg({ x: 0, y: 0 });
  const F = toSvg(first);
  const S = toSvg(second);
  const T = toSvg(third);
  const M = toSvg(mound);

  // 外野牆 path: from L → 通過 C（中外野 122m）→ R
  // SVG y 軸翻轉，要經過「上方」要用 sweep-flag = 1（螢幕上順時針）
  const outfieldArc = `M ${L.x} ${L.y} A ${arcR} ${arcR} 0 0 1 ${R.x} ${R.y}`;
  // 界內區域: home → L → arc 經過中外野 → R → home
  const fairTerritory = `M ${H.x} ${H.y} L ${L.x} ${L.y} A ${arcR} ${arcR} 0 0 1 ${R.x} ${R.y} Z`;

  const hoveredHit = hoveredId != null ? hits.find((h) => h.id === hoveredId) : null;

  return (
    <div className="relative space-y-3">
      <svg
        viewBox={`${VB_X} ${VB_Y - CF_DISTANCE} ${VB_W} ${VB_H}`}
        className="mx-auto h-56 w-full max-w-xl"
        role="img"
        aria-label="擊球落點場地圖"
      >
        {/* 將 viewBox y 原點對齊 SVG 左上角（轉換到 home 在底部） */}
        <g transform={`translate(0, ${0})`}>
          {/* 界內草地 */}
          <path d={fairTerritory} fill="rgba(34,197,94,0.10)" stroke="none" />

          {/* 外野牆（明顯的邊界線） */}
          <path d={outfieldArc} fill="none" stroke="rgba(34,197,94,0.95)" strokeWidth={1.4} strokeLinecap="round" />

          {/* 全壘打距離標示 */}
          <text x={L.x - 1} y={L.y - 2} fontSize={4} fill="rgba(203,213,225,0.85)" textAnchor="end" fontWeight={600}>
            {LF_RF_DISTANCE}m
          </text>
          <text x={R.x + 1} y={R.y - 2} fontSize={4} fill="rgba(203,213,225,0.85)" textAnchor="start" fontWeight={600}>
            {LF_RF_DISTANCE}m
          </text>
          <text x={C.x} y={C.y - 3} fontSize={4} fill="rgba(203,213,225,0.85)" textAnchor="middle" fontWeight={600}>
            {CF_DISTANCE}m
          </text>

          {/* 界外線 */}
          <line x1={H.x} y1={H.y} x2={L.x} y2={L.y} stroke="rgba(156,163,175,0.7)" strokeWidth={0.5} />
          <line x1={H.x} y1={H.y} x2={R.x} y2={R.y} stroke="rgba(156,163,175,0.7)" strokeWidth={0.5} />

          {/* 內野（正方形） */}
          <polygon
            points={`${H.x},${H.y} ${F.x},${F.y} ${S.x},${S.y} ${T.x},${T.y}`}
            fill="rgba(217,119,6,0.12)"
            stroke="rgba(217,119,6,0.55)"
            strokeWidth={0.5}
          />

          {/* 壘包 */}
          {[H, F, S, T].map((p, i) => (
            <rect
              key={i}
              x={p.x - 0.9}
              y={p.y - 0.9}
              width={1.8}
              height={1.8}
              fill="white"
              stroke="rgba(71,85,105,0.8)"
              strokeWidth={0.2}
              transform={`rotate(45 ${p.x} ${p.y})`}
            />
          ))}

          {/* 投手丘 */}
          <circle cx={M.x} cy={M.y} r={1.6} fill="rgba(217,119,6,0.5)" stroke="rgba(217,119,6,0.9)" strokeWidth={0.3} />

          {/* 擊球落點 */}
          {hits.map((hit) => {
            const clampedAngle = Math.max(-FOUL_HALF_ANGLE_DEG, Math.min(FOUL_HALF_ANGLE_DEG, hit.angle));
            const clampedDist = Math.min(CF_DISTANCE, Math.max(0, hit.distance));
            const p = toSvg(polarToField(clampedAngle, clampedDist));
            const isHover = hoveredId === hit.id;
            return (
              <circle
                key={hit.id}
                cx={p.x}
                cy={p.y}
                r={isHover ? 3 : 2.2}
                fill={hitColor(hit.exitVelo)}
                opacity={isHover ? 1 : 0.85}
                stroke={isHover ? "white" : "rgba(0,0,0,0.3)"}
                strokeWidth={isHover ? 0.6 : 0.3}
                style={{ cursor: "pointer", transition: "r 0.1s, opacity 0.1s" }}
                onMouseEnter={(e) => {
                  setHoveredId(hit.id);
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseMove={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseLeave={() => {
                  setHoveredId(null);
                  setTipPos(null);
                }}
              />
            );
          })}

          {/* Pull / Oppo 標示（場地外、界外線延伸方向，遠離全壘打牆） */}
          {(() => {
            const labelDist = LF_RF_DISTANCE + 24;
            const pullPt = toSvg(polarToField(-FOUL_HALF_ANGLE_DEG, labelDist));
            const oppoPt = toSvg(polarToField(FOUL_HALF_ANGLE_DEG, labelDist));
            return (
              <>
                <text
                  x={pullPt.x}
                  y={pullPt.y}
                  fontSize={5.5}
                  fill="rgba(209,213,219,0.85)"
                  textAnchor="middle"
                  fontWeight={700}
                >
                  ← Pull
                </text>
                <text
                  x={oppoPt.x}
                  y={oppoPt.y}
                  fontSize={5.5}
                  fill="rgba(209,213,219,0.85)"
                  textAnchor="middle"
                  fontWeight={700}
                >
                  Oppo →
                </text>
              </>
            );
          })()}
        </g>
      </svg>

      {/* 懸停 tooltip */}
      {hoveredHit && tipPos && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover/95 backdrop-blur px-3 py-2 text-xs shadow-lg"
          style={{
            left: tipPos.x + 12,
            top: tipPos.y + 12,
            transform: tipPos.x > 300 ? "translateX(-110%)" : undefined,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: hitColor(hoveredHit.exitVelo) }}
            />
            <span className="font-semibold">{hitCategory(hoveredHit.exitVelo)}</span>
          </div>
          <div className="space-y-0.5 text-foreground/80">
            <div>
              <span className="text-muted-foreground">初速：</span>
              <span className="font-medium">{hoveredHit.exitVelo.toFixed(1)} km/h</span>
            </div>
            <div>
              <span className="text-muted-foreground">仰角：</span>
              <span className="font-medium">{launchAngleCategory(hoveredHit.launchAngle)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">飛行距離：</span>
              <span className="font-medium">{hoveredHit.distance.toFixed(1)} m</span>
            </div>
            <div>
              <span className="text-muted-foreground">水平角：</span>
              <span className="font-medium">
                {hoveredHit.angle >= 0 ? "+" : ""}
                {hoveredHit.angle.toFixed(1)}°
              </span>
            </div>
          </div>
        </div>
      )}

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
