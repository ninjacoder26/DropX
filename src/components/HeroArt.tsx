/**
 * DropX hero artwork — a dusk Himalayan panorama in brand colors.
 * Fills the hero panel when no live drop artwork exists, so first paint
 * always looks intentional. Flat vector, zero requests, any aspect via slice.
 */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 500" className={className} role="img" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="dx-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8A52" />
          <stop offset="55%" stopColor="#F06427" />
          <stop offset="100%" stopColor="#F06427" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="dx-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#101010" />
          <stop offset="70%" stopColor="#1C1C1C" />
          <stop offset="100%" stopColor="#2A2118" />
        </linearGradient>
      </defs>

      <rect width={800} height={500} fill="url(#dx-sky)" />

      {/* stars */}
      <g fill="#F7F5F0">
        <circle cx={90} cy={60} r={3} opacity={0.8} />
        <circle cx={470} cy={55} r={3} opacity={0.75} />
        <circle cx={660} cy={60} r={2.6} opacity={0.7} />
        <circle cx={620} cy={160} r={2.4} opacity={0.55} />
      </g>

      {/* sun + glow */}
      <circle cx={580} cy={215} r={110} fill="url(#dx-sun)" opacity={0.55} />
      <circle cx={580} cy={215} r={58} fill="#F06427" />

      {/* birds */}
      <g stroke="#F7F5F0" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.85}>
        <path d="M 150 130 q 12 -12 24 0 q 12 -12 24 0" />
        <path d="M 670 170 q 9 -9 18 0 q 9 -9 18 0" />
      </g>

      {/* prayer flags */}
      <path d="M 0 28 C 200 60, 420 10, 620 44 L 800 30" fill="none" stroke="#F7F5F0" strokeWidth={3} opacity={0.5} />
      <g opacity={0.95}>
        <polygon points="150,44 172,47 161,70" fill="#F06427" />
        <polygon points="330,36 352,32 341,55" fill="#F7F5F0" />
        <polygon points="510,38 532,40 521,63" fill="#F06427" />
        <polygon points="670,46 692,46 681,69" fill="#F7F5F0" opacity={0.75} />
      </g>

      {/* far range */}
      <polygon points="0,330 120,210 210,300 330,190 430,300 540,215 660,305 740,240 800,295 800,500 0,500" fill="#2A2A2A" />
      {/* snow caps */}
      <g fill="#F7F5F0" opacity={0.9}>
        <polygon points="120,210 142,232 120,244 98,232" />
        <polygon points="330,190 354,214 330,226 306,214" />
        <polygon points="540,215 562,236 540,248 518,236" />
      </g>
      {/* near range */}
      <polygon points="0,390 140,300 260,380 400,310 540,390 680,320 800,380 800,500 0,500" fill="#101010" />
      {/* foreground hill */}
      <path d="M 0 500 L 0 440 C 180 410, 320 460, 520 435 C 640 422, 730 440, 800 430 L 800 500 Z" fill="#F06427" />

      {/* wordmark */}
      <text x={60} y={428} fontFamily="Archivo, Arial" fontWeight={900} fontSize={72} fill="#F7F5F0" letterSpacing={2}>DROP<tspan fill="#F06427">X</tspan></text>
      <text x={62} y={458} fontFamily="Inter, Arial" fontWeight={700} fontSize={19} fill="#F7F5F0" opacity={0.75} letterSpacing={4}>WEAR THE DROP · KTM 27.72°N</text>
    </svg>
  );
}
