/**
 * Hand-drawn category artwork — flat SVG scenes in brand colors.
 * Shows on category tiles until a real photo is uploaded in admin.
 * Aspect 4:3 (viewBox 400×300), scales to any tile size, zero requests.
 */
import type { ReactElement } from 'react';

function Dots() {
  const dots = [];
  for (let x = 20; x < 400; x += 40) {
    for (let y = 20; y < 300; y += 40) {
      dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={2.5} fill="#F7F5F0" opacity={0.08} />);
    }
  }
  return <g>{dots}</g>;
}

function StationeryArt() {
  return (
    <g>
      {/* notebook */}
      <rect x={110} y={55} width={150} height={190} rx={10} fill="#F7F5F0" />
      <rect x={110} y={55} width={26} height={190} rx={10} fill="#F06427" />
      <rect x={110} y={55} width={26} height={190} fill="#F06427" />
      <line x1={155} y1={100} x2={235} y2={100} stroke="#101010" strokeWidth={7} strokeLinecap="round" opacity={0.75} />
      <line x1={155} y1={128} x2={235} y2={128} stroke="#101010" strokeWidth={7} strokeLinecap="round" opacity={0.45} />
      <line x1={155} y1={156} x2={210} y2={156} stroke="#101010" strokeWidth={7} strokeLinecap="round" opacity={0.45} />
      <line x1={155} y1={184} x2={225} y2={184} stroke="#F06427" strokeWidth={7} strokeLinecap="round" />
      {/* pencil */}
      <g transform="rotate(24 300 190)">
        <rect x={288} y={70} width={24} height={150} rx={4} fill="#F06427" />
        <polygon points="288,220 312,220 300,252" fill="#F7F5F0" />
        <polygon points="296,232 304,232 300,252" fill="#101010" />
        <rect x={288} y={58} width={24} height={14} rx={4} fill="#F7F5F0" opacity={0.85} />
      </g>
      {/* paperclip */}
      <rect x={72} y={190} width={34} height={58} rx={17} fill="none" stroke="#F7F5F0" strokeWidth={8} opacity={0.7} />
    </g>
  );
}

function TechArt() {
  return (
    <g>
      {/* phone */}
      <rect x={140} y={45} width={120} height={210} rx={22} fill="#F7F5F0" />
      <rect x={152} y={75} width={96} height={150} rx={10} fill="#101010" />
      {/* bolt on screen */}
      <polygon points="208,95 182,155 202,155 192,205 222,140 201,140" fill="#F06427" />
      <circle cx={200} cy={60} r={4} fill="#101010" />
      {/* cable arc */}
      <path d="M 90 240 C 60 180, 90 120, 130 100" fill="none" stroke="#F06427" strokeWidth={10} strokeLinecap="round" />
      <circle cx={90} cy={240} r={9} fill="#F06427" />
      {/* earbud */}
      <rect x={292} y={150} width={26} height={60} rx={13} fill="#F7F5F0" />
      <circle cx={305} cy={140} r={20} fill="#F7F5F0" />
      <circle cx={305} cy={140} r={8} fill="#F06427" />
    </g>
  );
}

function FashionArt() {
  return (
    <g>
      {/* tee */}
      <polygon
        points="150,70 110,95 130,130 150,118 150,240 250,240 250,118 270,130 290,95 250,70 225,85 200,95 175,85"
        fill="#F7F5F0"
      />
      <rect x={185} y={150} width={30} height={26} rx={4} fill="#F06427" />
      {/* hanger */}
      <path d="M 200 30 C 200 18, 218 18, 218 30 L 218 44 L 150 78 M 218 44 L 286 78" fill="none" stroke="#F06427" strokeWidth={9} strokeLinecap="round" />
      {/* sneaker */}
      <g transform="rotate(-8 300 220)">
        <path d="M 252 210 L 252 180 L 268 180 L 292 200 L 330 206 L 336 226 L 252 226 Z" fill="#F7F5F0" />
        <rect x={248} y={222} width={92} height={12} rx={6} fill="#F06427" />
        <line x1={276} y1={184} x2={288} y2={204} stroke="#101010" strokeWidth={5} strokeLinecap="round" />
        <line x1={288} y1={186} x2={300} y2={206} stroke="#101010" strokeWidth={5} strokeLinecap="round" />
      </g>
    </g>
  );
}

function LifestyleArt() {
  return (
    <g>
      {/* sun */}
      <circle cx={300} cy={80} r={34} fill="#F06427" />
      <g stroke="#F06427" strokeWidth={7} strokeLinecap="round">
        <line x1={300} y1={28} x2={300} y2={14} />
        <line x1={300} y1={132} x2={300} y2={146} />
        <line x1={248} y1={80} x2={234} y2={80} />
        <line x1={352} y1={80} x2={366} y2={80} />
      </g>
      {/* bottle */}
      <rect x={105} y={110} width={86} height={140} rx={20} fill="#F7F5F0" />
      <rect x={128} y={88} width={40} height={26} rx={8} fill="#F06427" />
      <rect x={105} y={160} width={86} height={18} fill="#F06427" opacity={0.85} />
      <line x1={125} y1={200} x2={171} y2={200} stroke="#101010" strokeWidth={7} strokeLinecap="round" opacity={0.5} />
      <line x1={125} y1={218} x2={160} y2={218} stroke="#101010" strokeWidth={7} strokeLinecap="round" opacity={0.3} />
      {/* ground waves */}
      <path d="M 40 262 C 90 248, 140 276, 190 262 S 290 248, 360 262" fill="none" stroke="#F7F5F0" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
    </g>
  );
}

function GenericArt() {
  return (
    <g>
      <rect x={140} y={90} width={120} height={120} rx={24} fill="#F06427" />
      <text x={200} y={178} textAnchor="middle" fontFamily="Archivo, Arial" fontWeight={900} fontSize={64} fill="#F7F5F0">DX</text>
    </g>
  );
}

const ART: Record<string, () => ReactElement> = {
  'stationery-study': StationeryArt,
  'tech-accessories': TechArt,
  'fashion-accessories': FashionArt,
  'lifestyle-fun': LifestyleArt,
};

export function CategoryArt({ slug, className }: { slug: string; className?: string }) {
  const Scene = ART[slug] ?? GenericArt;
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width={400} height={300} fill="#1C1C1C" />
      <Dots />
      <Scene />
    </svg>
  );
}
