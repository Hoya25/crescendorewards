/**
 * Crescendo 360 Logo System
 * Three variants: Orbital (primary), Bold (merch), Classic (formal)
 * Palette: Mint #34d399 + Gold #fbbf24
 */
import React from 'react';

export const CRESCENDO_COLORS = {
  mint: '#34d399',
  mintDark: '#059669',
  gold: '#fbbf24',
  goldDark: '#d97706',
  tiers: {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF',
  },
} as const;

type LogoVariant = 'orbital' | 'bold' | 'classic';
type ThemeMode = 'dark' | 'light';
type TierName = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface CrescendoLogoProps {
  variant?: LogoVariant;
  size?: number;
  showWordmark?: boolean;
  theme?: ThemeMode;
  className?: string;
}

interface CrescendoProgressRingProps {
  progress: number;
  tier?: TierName;
  size?: number;
  showDays?: boolean;
  className?: string;
}

const rad = (a: number) => (a * Math.PI) / 180;

const getColors = (theme: ThemeMode) => ({
  mint: theme === 'dark' ? '#34d399' : '#059669',
  gold: theme === 'dark' ? '#fbbf24' : '#d97706',
  center: theme === 'dark' ? '#ffffff' : '#059669',
});

const R = 36;
const GAP_DEG = 35;
const ARC_DEG = 360 - GAP_DEG;
const START_ANGLE = -90;
const END_ANGLE = START_ANGLE + ARC_DEG;
const X1 = R * Math.cos(rad(START_ANGLE));
const Y1 = R * Math.sin(rad(START_ANGLE));
const X2 = R * Math.cos(rad(END_ANGLE));
const Y2 = R * Math.sin(rad(END_ANGLE));
const ARC_PATH = `M ${X1.toFixed(2)} ${Y1.toFixed(2)} A ${R} ${R} 0 1 1 ${X2.toFixed(2)} ${Y2.toFixed(2)}`;

export function CrescendoLogo({
  variant = 'orbital',
  size = 40,
  showWordmark = false,
  theme = 'dark',
  className = '',
}: CrescendoLogoProps) {
  const colors = getColors(theme);
  const viewH = showWordmark ? 200 : 100;
  const cy = showWordmark ? 80 : 50;
  const uid = `crsc-${variant}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <svg viewBox={`0 0 200 ${viewH}`} width={size} height={size * (viewH / 200)} className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.mint} />
          <stop offset={variant === 'bold' ? '50%' : '80%'} stopColor={variant === 'bold' ? colors.mint : colors.gold} stopOpacity={variant === 'bold' ? 1 : 0.8} />
          {variant === 'bold' && <stop offset="100%" stopColor={colors.gold} />}
        </linearGradient>
        {variant === 'orbital' && (
          <filter id={`${uid}-glow`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>
      <g transform={`translate(100,${cy})`}>
        <circle cx="0" cy="0" r={variant === 'bold' ? 34 : R} fill="none" stroke={colors.mint} strokeWidth={variant === 'bold' ? 10 : 3.5} opacity={theme === 'dark' ? 0.04 : 0.08} />
        {variant === 'bold' ? (
          <path d="M -10.54 -32.33 A 34 34 0 1 1 -20.59 -27.16" fill="none" stroke={`url(#${uid}-grad)`} strokeWidth="10" strokeLinecap="round" />
        ) : (
          <path d={ARC_PATH} fill="none" stroke={`url(#${uid}-grad)`} strokeWidth={variant === 'orbital' ? 3.5 : 5} strokeLinecap="round" />
        )}
        {variant === 'orbital' && (
          <>
            <circle cx={X1} cy={Y1} r="6" fill={colors.mint} opacity="0.15" filter={`url(#${uid}-glow)`} />
            <circle cx={X1} cy={Y1} r="3.5" fill={colors.mint}>
              <animate attributeName="r" values="3.5;4.5;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={X2} cy={Y2} r="2" fill={colors.gold} opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}
        {variant === 'classic' && (
          <>
            <circle cx={X1} cy={Y1} r="3" fill={colors.mint} />
            <circle cx={X2} cy={Y2} r="2" fill={colors.gold} opacity="0.4" />
          </>
        )}
        <text x="0" y={variant === 'bold' ? 4 : 3} textAnchor="middle" dominantBaseline="central" fill={variant === 'bold' ? colors.center : colors.mint} fontFamily="Inter,system-ui,sans-serif" fontSize={variant === 'bold' ? 22 : 20} fontWeight={variant === 'bold' ? 900 : 800} letterSpacing="1">360</text>
      </g>
      {showWordmark && (
        <text x="100" y="170" textAnchor="middle" fill={colors.mint} fontFamily="Inter,system-ui,sans-serif" fontSize="19" fontWeight="800" letterSpacing="7">CRESCENDO</text>
      )}
    </svg>
  );
}

export function CrescendoProgressRing({
  progress,
  tier = 'bronze',
  size = 80,
  showDays = true,
  className = '',
}: CrescendoProgressRingProps) {
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.min(progress, 360) / 360) * circumference;
  const tierColor = CRESCENDO_COLORS.tiers[tier];
  const daysLeft = 360 - progress;

  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className={className}>
      <circle cx="40" cy="40" r={r} fill="none" stroke={tierColor} strokeWidth="4" opacity="0.15" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={tierColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${filled} ${circumference}`} transform="rotate(-90 40 40)" style={{ transition: 'stroke-dasharray 1s ease' }} />
      {showDays && (
        <>
          <text x="40" y="37" textAnchor="middle" fill={tierColor} fontSize="14" fontWeight="800" fontFamily="Inter,sans-serif">{progress}</text>
          <text x="40" y="50" textAnchor="middle" fill={tierColor} fontSize="7" fontWeight="500" fontFamily="Inter,sans-serif" opacity="0.7">{daysLeft > 0 ? `${daysLeft} left` : 'complete'}</text>
        </>
      )}
    </svg>
  );
}

export default CrescendoLogo;
