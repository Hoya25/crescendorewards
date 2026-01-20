// Stripe configuration
// Publishable keys are safe to include in frontend code - they're designed to be public

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Srj7TL2izU9EyCBe1hdPxvurYTLOosixrNjw8M9Pr8QVzu4dSAFvWxIHihZOIoaLOTq96W3kkpyRh2tJioygC8z000ZBWuji4';

// Stripe price IDs for claim packages (TEST MODE)
export const STRIPE_PRICES = {
  starter: 'price_1Srn1rLVb8JMU0JnDoZD3Yx6',   // $50 - 10 Claims
  popular: 'price_1Srn2HLVb8JMU0JnsrXVR8ey',   // $125 - 25 Claims
  premium: 'price_1Srn4BLVb8JMU0JnQJqbo6qO',   // $250 - 50 Claims
  ultimate: 'price_1Srn5VLVb8JMU0JnoPhLuYeC',  // $500 - 100 Claims
  mega: 'price_1Srn6mLVb8JMU0Jnhacdqn48',      // $1000 - 220 Claims
} as const;

export type StripePriceId = keyof typeof STRIPE_PRICES;
