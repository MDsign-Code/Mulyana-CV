import React from 'react';

interface AwardWinnerBadgeProps {
  count?: number;
  size?: 'compact' | 'showcase';
}

export const AwardWinnerBadge: React.FC<AwardWinnerBadgeProps> = ({
  count = 100,
  size = 'showcase',
}) => {
  const isCompact = size === 'compact';

  if (isCompact) {
    return (
      <div className="inline-flex items-center gap-3 rounded-xl border border-amber-500/40 bg-[#1D2435] px-3.5 py-2 transition-colors hover:border-amber-400">
        <svg
          viewBox="0 0 64 64"
          className="h-9 w-9 shrink-0"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="awardGoldCompact" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="50%" stopColor="#F58220" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="#161B26"
            stroke="url(#awardGoldCompact)"
            strokeWidth="2.5"
          />
          <circle
            cx="32"
            cy="32"
            r="22"
            fill="none"
            stroke="#F58220"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="2 2.5"
          />
          <path
            d="M23 19h18v10c0 5-4 9-9 9s-9-4-9-9V19zm-5 3h5v6c-3 0-5-2.5-5-6zm28 0h-5v6c3 0 5-2.5 5-6zM32 38v7m-6 3h12"
            fill="none"
            stroke="url(#awardGoldCompact)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="text-left leading-tight">
          <p className="font-mono-tabular text-xs font-bold text-amber-300">
            {count}+ CONTEST WINS
          </p>
          <p className="text-[11px] font-medium text-slate-300">
            Award-Winning Designer
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-44 w-44 shrink-0 items-center justify-center select-none">
      <div
        aria-hidden="true"
        className="absolute inset-2 rounded-full bg-amber-500/15 blur-xl"
      />
      <svg
        viewBox="0 0 180 180"
        className="relative h-full w-full drop-shadow-[0_12px_28px_rgba(245,130,32,0.22)]"
        role="img"
        aria-label={`${count}+ Award-Winning Design Contests Seal`}
      >
        <defs>
          <linearGradient id="sealGoldOuter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="45%" stopColor="#F58220" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="sealGoldSurface" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#232B3E" />
            <stop offset="100%" stopColor="#131823" />
          </linearGradient>
          <path
            id="topArcText"
            d="M 30,90 A 60,60 0 1,1 150,90"
          />
          <path
            id="bottomArcText"
            d="M 152,92 A 62,62 0 1,1 28,92"
          />
        </defs>

        {/* Outer Rosette Gear Ring */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = i * 15;
          return (
            <rect
              key={i}
              x="87"
              y="5"
              width="6"
              height="12"
              rx="2"
              fill="url(#sealGoldOuter)"
              opacity={i % 2 === 0 ? 0.92 : 0.45}
              transform={`rotate(${angle} 90 90)`}
            />
          );
        })}

        {/* Main Circular Medal Plate */}
        <circle
          cx="90"
          cy="90"
          r="76"
          fill="url(#sealGoldSurface)"
          stroke="url(#sealGoldOuter)"
          strokeWidth="3"
        />
        <circle
          cx="90"
          cy="90"
          r="67"
          fill="none"
          stroke="#F58220"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <circle
          cx="90"
          cy="90"
          r="50"
          fill="#161B26"
          stroke="url(#sealGoldOuter)"
          strokeOpacity="0.65"
          strokeWidth="1.25"
        />

        {/* Curved Perimeter Typography */}
        <text
          fill="#FDE68A"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="2.4"
        >
          <textPath href="#topArcText" startOffset="50%" textAnchor="middle">
            AWARD-WINNING DESIGN
          </textPath>
        </text>
        <text
          fill="#F58220"
          fontSize="8"
          fontWeight="700"
          letterSpacing="2.2"
        >
          <textPath href="#bottomArcText" startOffset="50%" textAnchor="middle">
            GLOBAL CONTESTS
          </textPath>
        </text>

        {/* Center Trophy Crown Mark */}
        <path
          d="M80 56l4 6 6-7 6 7 4-6-2 10H82l-2-10z"
          fill="url(#sealGoldOuter)"
        />

        {/* Centerpiece Metric */}
        <text
          x="90"
          y="102"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="34"
          fontWeight="800"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {count}+
        </text>

        {/* Center Divider & Subtitle */}
        <line
          x1="62"
          y1="112"
          x2="118"
          y2="112"
          stroke="#F58220"
          strokeOpacity="0.6"
          strokeWidth="1"
        />
        <text
          x="90"
          y="125"
          textAnchor="middle"
          fill="#FCD34D"
          fontSize="9"
          fontWeight="700"
          letterSpacing="1.6"
        >
          1ST PLACE WINS
        </text>
      </svg>
    </div>
  );
};
