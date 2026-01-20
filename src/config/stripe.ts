// Stripe configuration
// Publishable keys are safe to include in frontend code - they're designed to be public

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Srj7TL2izU9EyCBe1hdPxvurYTLOosixrNjw8M9Pr8QVzu4dSAFvWxIHihZOIoaLOTq96W3kkpyRh2tJioygC8z000ZBWuji4';

// Stripe price IDs for claim packages (account: acct_1STsp5LH9lB6iuZg)
export const STRIPE_PRICES = {
  starter: 'price_1STt82LH9lB6iuZgexn693ld',   // $50 - 10 Claims
  popular: 'price_1STt8GLH9lB6iuZg0ZXNlYAf',   // $125 - 25 Claims
  premium: 'price_1STt8aLH9lB6iuZgjKuIc0vh',   // $250 - 50 Claims
  ultimate: 'price_1STtAoLH9lB6iuZghenXBMFK',  // $500 - 100 Claims
  mega: 'price_1STtB2LH9lB6iuZgL4qyz4lC',      // $1000 - 210 Claims
} as const;

export type StripePriceId = keyof typeof STRIPE_PRICES;
