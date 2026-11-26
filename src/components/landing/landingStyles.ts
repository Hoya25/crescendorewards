import type { CSSProperties } from 'react';

export const barlow = "'Barlow Condensed', sans-serif";
export const dmSans = "'DM Sans', sans-serif";
export const BH_SIGNUP_URL = 'https://bountyhunter.nctr.live/auth?mode=signup';

export const sectionClass = 'px-6 md:px-12 py-20 md:py-28';

export const sectionHeading: CSSProperties = {
  fontFamily: barlow,
  fontWeight: 700,
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  color: 'var(--landing-ink)',
  lineHeight: 1.05,
  margin: 0,
};

export const darkButton: CSSProperties = {
  fontFamily: barlow,
  fontWeight: 700,
  fontSize: '14px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  backgroundColor: 'var(--landing-ink)',
  color: 'var(--landing-card)',
  border: 'none',
  borderRadius: 0,
  height: '56px',
  width: '100%',
  maxWidth: '28rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  cursor: 'pointer',
};

export const outlineButton: CSSProperties = {
  ...darkButton,
  backgroundColor: 'transparent',
  color: 'var(--landing-ink)',
  border: '1px solid var(--landing-ink)',
};
