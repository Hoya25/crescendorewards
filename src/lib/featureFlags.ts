// Impact Engine visibility gates — DEFAULT OFF
// Internal partnership codenames (GROUNDBALL, STARDUST, THROTTLE, SWEAT,
// SISU, INSPIRATION) are confidential and must not appear on member-facing
// surfaces. These flags gate any UI that would render those codenames or
// their sector-specific reward catalogs to members.
//
// Flip to true via env var only after the corresponding partner approves
// public launch. When a flag is ON, gated components render with a generic
// public-safe label (e.g. "Sports Rewards") until a branded name is approved.
export const FEATURE_FLAGS = {
  ENGINE_GROUNDBALL: import.meta.env.VITE_ENGINE_GROUNDBALL_ENABLED === 'true',
  ENGINE_STARDUST: import.meta.env.VITE_ENGINE_STARDUST_ENABLED === 'true',
  ENGINE_THROTTLE: import.meta.env.VITE_ENGINE_THROTTLE_ENABLED === 'true',
  ENGINE_SWEAT: import.meta.env.VITE_ENGINE_SWEAT_ENABLED === 'true',
  ENGINE_SISU: import.meta.env.VITE_ENGINE_SISU_ENABLED === 'true',
  ENGINE_INSPIRATION: import.meta.env.VITE_ENGINE_INSPIRATION_ENABLED === 'true',
};

// Public-safe display labels for use when a flag is ON but the partner has
// not yet approved a branded name.
export const ENGINE_PUBLIC_LABELS = {
  GROUNDBALL: 'Sports Rewards',
  STARDUST: 'Entertainment Rewards',
  THROTTLE: 'Drinks Rewards',
  SWEAT: 'Fitness Rewards',
  SISU: 'Recovery Rewards',
  INSPIRATION: 'Creator Rewards',
} as const;
