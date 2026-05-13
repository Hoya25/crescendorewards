import React from 'react';
import { NCTRWordmark, NCTRCircleN } from './brand/NCTRLogos';

export type NCTRLogoVariant =
  | 'wordmark-lime'
  | 'wordmark-grey'
  | 'wordmark-light'
  | 'wordmark-white'
  | 'wordmark-black'
  | 'icon';

// Old API kept for backward compatibility with existing call sites.
type LegacySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type LegacyVariant = 'dark' | 'light' | 'auto';

interface NCTRLogoProps {
  variant?: NCTRLogoVariant | LegacyVariant;
  height?: number;
  /** Legacy prop — mapped to height. Prefer `height`. */
  size?: LegacySize;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

const VARIANT_FILL: Record<NCTRLogoVariant, string> = {
  'wordmark-lime': '#E2FF6D',
  'wordmark-grey': '#5A5A58',
  'wordmark-light': '#D9D9D9',
  'wordmark-white': '#FFFFFF',
  'wordmark-black': '#131313',
  'icon': '#E2FF6D',
};

const SIZE_TO_HEIGHT: Record<LegacySize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const LEGACY_VARIANT_MAP: Record<LegacyVariant, NCTRLogoVariant> = {
  dark: 'wordmark-grey',   // was: dark logo on light backgrounds
  light: 'wordmark-lime',  // was: light logo on dark backgrounds
  auto: 'wordmark-grey',   // safe default for the light-mode landing
};

function isLegacyVariant(v: string): v is LegacyVariant {
  return v === 'dark' || v === 'light' || v === 'auto';
}

export const NCTRLogo: React.FC<NCTRLogoProps> = ({
  variant = 'wordmark-lime',
  height,
  size,
  className = '',
  style,
  'aria-label': ariaLabel = 'NCTR',
}) => {
  const resolvedVariant: NCTRLogoVariant = isLegacyVariant(variant)
    ? LEGACY_VARIANT_MAP[variant]
    : variant;

  const resolvedHeight =
    height ?? (size ? SIZE_TO_HEIGHT[size] : 20);

  const fill = VARIANT_FILL[resolvedVariant];

  const inlineStyle: React.CSSProperties = {
    display: 'inline-block',
    verticalAlign: 'middle',
    height: `${resolvedHeight}px`,
    width: 'auto',
    marginLeft: '4px',
    marginRight: '4px',
    ...style,
  };

  if (resolvedVariant === 'icon') {
    return (
      <NCTRCircleN
        fillColor={fill}
        size={resolvedHeight}
        className={className}
        style={inlineStyle}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <NCTRWordmark
      fill={fill}
      height={resolvedHeight}
      className={className}
      style={inlineStyle}
      aria-label={ariaLabel}
    />
  );
};

export default NCTRLogo;
