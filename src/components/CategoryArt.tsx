/**
 * Category artwork — bold flat icons in brand colors, one shared halo.
 * Shows on category tiles until a real photo is uploaded in admin.
 * Aspect 4:3 (viewBox 400×300), scales to any tile size, zero requests.
 */
import type { ReactElement } from 'react';

function StationeryArt() {
  return (
    <g>
      <rect x={104} y={60} width={150} height={180} rx={12} fill="#F7F5F0" />
      <rect x={104} y={60} width={30} height={180} fill="#F06427" />
      <line x1={156} y1={108} x2={232} y2={108} stroke="#101010" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
      <line x1={156} y1={138} x2={232} y2={138} stroke="#101010" strokeWidth={8} strokeLinecap="round" opacity={0.4} />
      <line x1={156} y1={168} x2={222} y2={168} stroke="#F06427" strokeWidth={8} strokeLinecap="round" />
      <g transform="rotate(24 310 190)">
        <rect x={298} y={80} width={26} height={130} rx={5} fill="#F06427" />
        <polygon points="298,210 324,210 311,246" fill="#F7F5F0" />
      </g>
    </g>
  );
}

function TechArt() {
  return (
    <g>
      <rect x={140} y={50} width={120} height={200} rx={24} fill="#F7F5F0" />
      <rect x={154} y={80} width={92} height={140} rx={10} fill="#101010" />
      <polygon points="208,100 184,156 204,156 194,200 220,142 200,142" fill="#F06427" />
      <path d="M 92 244 C 64 184, 96 128, 132 108" fill="none" stroke="#F06427" strokeWidth={11} strokeLinecap="round" />
    </g>
  );
}

function FashionArt() {
  return (
    <g>
      <path d="M 200 34 C 200 24, 216 24, 216 34 L 216 46 L 152 78 M 216 46 L 284 78" fill="none" stroke="#F06427" strokeWidth={10} strokeLinecap="round" />
      <polygon
        points="152,76 114,100 132,132 152,121 152,238 248,238 248,121 268,132 286,100 248,76 224,90 200,98 176,90"
        fill="#F7F5F0"
      />
      <rect x={186} y={152} width={28} height={24} rx={4} fill="#F06427" />
      <path d="M 256 208 L 256 184 L 272 184 L 296 202 L 332 208 L 336 226 L 256 226 Z" fill="#F7F5F0" />
      <rect x={252} y={222} width={88} height={12} rx={6} fill="#F06427" />
    </g>
  );
}

function LifestyleArt() {
  return (
    <g>
      <circle cx={296} cy={82} r={36} fill="#F06427" />
      <rect x={104} y={112} width={88} height={136} rx={22} fill="#F7F5F0" />
      <rect x={128} y={90} width={40} height={26} rx={8} fill="#F06427" />
      <rect x={104} y={162} width={88} height={18} fill="#F06427" opacity={0.85} />
      <path d="M 44 264 C 100 250, 150 276, 205 262 S 300 250, 360 262" fill="none" stroke="#F7F5F0" strokeWidth={9} strokeLinecap="round" opacity={0.6} />
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
      <circle cx={200} cy={150} r={118} fill="#F06427" opacity={0.16} />
      <Scene />
    </svg>
  );
}
