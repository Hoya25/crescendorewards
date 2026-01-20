// Stripe configuration
// Publishable keys are safe to include in frontend code - they're designed to be public

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Srj7TL2izU9EyCBe1hdPxvurYTLOosixrNjw8M9Pr8QVzu4dSAFvWxIHihZOIoaLOTq96W3kkpyRh2tJioygC8z000ZBWuji4';

// Stripe price IDs for claim packages
export const STRIPE_PRICES = {
  starter: 'price_1SrkBlL2izU9EyCBbjOqLpOd',   // $50 - 10 Claims
  popular: 'price_1SrkC1L2izU9EyCBvPzjf0Zs',   // $125 - 25 Claims
  premium: 'price_1SrkCUL2izU9EyCBlPiUk6BX',   // $250 - 50 Claims
  ultimate: 'price_1SrkDHL2izU9EyCBkD9Qeu9a',  // $500 - 100 Claims
  mega: 'price_1SrkDUL2izU9EyCBIJ9FknaF',      // $1000 - 210 Claims
} as const;

export type StripePriceId = keyof typeof STRIPE_PRICES;
