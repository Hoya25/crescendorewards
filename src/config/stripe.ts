// Stripe configuration - LIVE MODE
// Publishable keys are safe to include in frontend code - they're designed to be public

export const STRIPE_PUBLISHABLE_KEY = 'pk_live_51STsp5LH9lB6iuZgjT1CExwA8L11tx5Ixf5zBsZg0xSu5j0MwYcw1FRdtNUe97XFlav6dcYrnNfoaaZpij3rFyfY00ywbg2Y7n';

// Stripe price IDs for claim packages (LIVE MODE)
export const STRIPE_PRICES = {
  lite: 'price_1SsSKQLH9lB6iuZggR8dJTkd',      // $25 - 5 Claims
  starter: 'price_1SsSKRLH9lB6iuZgCo3zj7Zr',   // $55 - 12 Claims
  plus: 'price_1SsSKSLH9lB6iuZg11fH8HLR',      // $110 - 25 Claims
  core: 'price_1SsSKSLH9lB6iuZgxgCPdO2S',      // $215 - 50 Claims
  pro: 'price_1SsSKTLH9lB6iuZgAklAAuLU',       // $420 - 100 Claims
  premium: 'price_1SsSKULH9lB6iuZgQm2TNM6M',   // $715 - 175 Claims
  elite: 'price_1SsSKULH9lB6iuZgmAaaoEMd',     // $1,250 - 310 Claims
  mega: 'price_1SsSKVLH9lB6iuZgkAVWpWIW',      // $2,500 - 625 Claims
  ultra: 'price_1SsSKVLH9lB6iuZgIJTtt62T',     // $5,000 - 1,250 Claims
  max: 'price_1SsSKWLH9lB6iuZgrkIc1tsb',       // $25,000 - 6,250 Claims
} as const;

export type StripePriceId = keyof typeof STRIPE_PRICES;
