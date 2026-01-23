# Crescendo App - Comprehensive Technical Summary

**Generated:** January 23, 2026  
**Version:** Beta  
**Live URL:** https://crescendo-nctr-live.lovable.app  
**Preview URL:** https://id-preview--b7bca209-cde6-4446-b370-04f75ce9b6da.lovable.app

---

## 1. Project Structure

### Main Folders
```
src/
├── assets/              # Static assets (logos, images)
├── components/          # React components
│   ├── admin/           # Admin panel components (20+ files)
│   ├── claims/          # Claims-related UI
│   ├── dashboard/       # Dashboard widgets
│   ├── earning/         # Earning opportunities UI
│   ├── navigation/      # Mobile/desktop navigation
│   ├── onboarding/      # User onboarding flow
│   ├── profile/         # Profile components
│   ├── rewards/         # Reward cards, filters, carousels
│   ├── skeletons/       # Loading skeleton components
│   ├── sponsor/         # Sponsor dashboard
│   ├── ui/              # shadcn/ui base components (50+ files)
│   └── user/            # User-specific components
├── config/              # Configuration (Stripe)
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks (26 files)
├── integrations/        # Supabase client & types (auto-generated)
├── lib/                 # Utility libraries
├── pages/               # Page-level components
├── providers/           # Web3 providers
├── types/               # TypeScript type definitions
└── utils/               # Helper functions

supabase/
├── config.toml          # Supabase configuration
└── functions/           # Edge Functions (17 functions)
    ├── _shared/         # Shared utilities (CORS)
    ├── create-checkout-session/
    ├── create-stripe-products/
    ├── generate-sweat-token-image/
    ├── merge-wallet-user/
    ├── send-approval-notification/
    ├── send-delivery-notification/
    ├── send-feedback-notification/
    ├── send-gift-notification/
    ├── send-purchase-confirmation/
    ├── send-submission-notification/
    ├── stripe-webhook/
    ├── submit-external-feedback/
    ├── sync-crescendo-profiles/
    ├── sync-garden-portfolio/
    ├── sync-packages-stripe/
    └── wallet-auth/

docs/                    # Documentation
public/                  # Public assets
├── brands/              # Brand logos
├── rewards/             # Reward images
└── favicon.ico
```

### Page Routes

#### Public Routes (No Auth Required)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | LandingPage | Marketing landing (redirects to /dashboard if authenticated) |
| `/rewards` | RewardsPool | Browse all available rewards |
| `/rewards/:id` | RewardDetailPage | Individual reward details |
| `/food-beverage` | FoodBeveragePage | Food & beverage rewards filter |
| `/terms` | TermsPage | Terms of service |
| `/privacy` | PrivacyPage | Privacy policy |
| `/help`, `/faq` | HelpPage | Help/FAQ page |
| `/claim` | ClaimGiftPage | Claim gift code redemption |
| `/sponsors` | SponsorsPage | View all sponsors |
| `/become-sponsor` | BecomeASponsorPage | Sponsor application |
| `/sponsors/:slug` | SponsorProfilePage | Individual sponsor profile |

#### Protected Routes (Auth Required)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | Dashboard | User home dashboard |
| `/earn` | EarnNCTR | Earning opportunities |
| `/profile` | ProfilePage | User profile management |
| `/profile/delivery` | DeliveryProfilePage | Delivery information for claims |
| `/membership` | MembershipLevelPage | Status tier information |
| `/membership/history` | MembershipHistoryPage | Tier upgrade history |
| `/membership/statistics` | MembershipStatisticsPage | Member statistics |
| `/submit-reward` | SubmitRewardsPage | Submit new reward ideas |
| `/my-submissions` | MySubmissionsPage | View submitted rewards |
| `/purchase-history` | PurchaseHistoryPage | Purchase records |
| `/buy-claims` | BuyClaimsPage | Purchase claim passes |
| `/gift-claims` | GiftClaimsPage | Send/manage gift claims |
| `/claims` | ClaimsPage | View claimed rewards |
| `/referrals` | ReferralAnalyticsDashboard | Referral program analytics |
| `/wishlist` | WishlistPage | Saved reward wishlist |
| `/favorites` | FavoritesPage | Favorited rewards |
| `/sponsor/dashboard` | SponsorDashboard | Sponsor management dashboard |

#### Admin Routes
| Route | Views | Purpose |
|-------|-------|---------|
| `/admin/*` | 20+ views via AdminPanel | Full admin panel with internal routing |

**Admin Panel Views:**
- Dashboard, Submissions, Rewards, Sponsored Rewards, Campaigns
- Claims, Gifts, Purchases, Packages, Brands, Sponsors
- Wishlists, Wishlist Analytics, Users, User Notifications
- Sync Verification, Team Management, Activity Log
- Feedback, Settings, Shop Settings, Earning Opportunities

---

## 2. Database Schema

### Tables Overview

| Table | Purpose | Row Count (approx) |
|-------|---------|-------------------|
| `unified_profiles` | Central user identity (cross-platform) | Primary user table |
| `profiles` | Legacy Crescendo user data | Synced with unified_profiles |
| `rewards` | Available rewards catalog | Core content |
| `rewards_claims` | User reward claims | Transaction records |
| `reward_submissions` | User-submitted reward ideas | UGC pipeline |
| `reward_submission_changes` | Version history for submissions | Audit trail |
| `reward_wishlists` | User wishlists | User preferences |
| `reward_watchlist` | Stock alerts | User preferences |
| `reward_shares` | Referral sharing tracking | Analytics |
| `brands` | Brand partners | Partner content |
| `sponsors` | Sponsor profiles | Partner content |
| `sponsored_campaigns` | Active sponsor campaigns | Campaigns |
| `sponsorship_campaigns` | Detailed campaign management | Campaigns |
| `sponsorship_transactions` | Sponsor payment records | Financial |
| `sponsor_applications` | Sponsor applications | Pipeline |
| `claim_packages` | Purchasable claim bundles | Products |
| `claim_gifts` | Gift claim transfers | Transactions |
| `purchases` | Purchase records | Financial |
| `notifications` | User notifications | Communication |
| `feedback` | User feedback submissions | UGC |
| `admin_users` | Admin team members | Access control |
| `admin_activity_log` | Admin action audit log | Audit |
| `admin_settings` | Admin configuration | Config |
| `user_roles` | Role assignments (admin enum) | Access control |
| `status_tiers` | Membership tier definitions | Tier system |
| `wallet_portfolio` | Wallet NCTR balances | Web3 data |
| `membership_history` | Tier change history | Analytics |
| `earning_opportunities` | Ways to earn NCTR | Content |
| `referrals` | Referral tracking | Growth |
| `auth_nonces` | Wallet auth nonces | Security |
| `shop_settings` | Shop configuration | Config |
| `shop_transactions` | Shop purchase records | Financial |
| `cross_platform_activity_log` | Cross-app activity | Analytics |
| `user_delivery_profiles` | Delivery/contact info | Fulfillment |

### Key Table Schemas

#### `unified_profiles`
```sql
id                    UUID PRIMARY KEY
auth_user_id          UUID (references auth.users)
email                 TEXT
display_name          TEXT
avatar_url            TEXT
wallet_address        TEXT
current_tier_id       UUID (references status_tiers)
crescendo_data        JSONB
garden_data           JSONB
tier_calculated_at    TIMESTAMPTZ
last_active_crescendo TIMESTAMPTZ
last_active_garden    TIMESTAMPTZ
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

#### `profiles` (Legacy)
```sql
id                      UUID PRIMARY KEY
email                   TEXT
full_name               TEXT
avatar_url              TEXT
bio                     TEXT
level                   INTEGER
locked_nctr             INTEGER
available_nctr          INTEGER
claim_balance           INTEGER
referral_code           TEXT
referred_by             UUID
has_claimed_signup_bonus BOOLEAN
has_status_access_pass   BOOLEAN
wallet_address          TEXT
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

#### `rewards`
```sql
id                      UUID PRIMARY KEY
title                   TEXT NOT NULL
description             TEXT
category                TEXT
cost                    INTEGER (claims required)
image_url               TEXT
stock_quantity          INTEGER
is_active               BOOLEAN
is_featured             BOOLEAN
is_sponsored            BOOLEAN
linked_sponsor_id       UUID (references sponsors)
campaign_id             UUID (references sponsored_campaigns)
min_status_tier         TEXT
status_tier_claims_cost JSONB (tier-based pricing)
delivery_method         TEXT
delivery_instructions   TEXT
required_user_data      JSONB
contribution_model      TEXT
cost_per_claim          INTEGER
revenue_share_percent   INTEGER
sponsor_enabled         BOOLEAN
sponsor_name            TEXT
sponsor_logo            TEXT
sponsor_logo_url        TEXT
sponsor_link            TEXT
sponsor_cta_text        TEXT
sponsor_cta_url         TEXT
sponsor_message         TEXT
sponsor_start_date      DATE
sponsor_end_date        DATE
token_gated             BOOLEAN
token_name              TEXT
token_symbol            TEXT
token_contract_address  TEXT
minimum_token_balance   INTEGER
brand_id                UUID (references brands)
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

#### `rewards_claims`
```sql
id                UUID PRIMARY KEY
user_id           UUID NOT NULL
reward_id         UUID (references rewards)
status            TEXT ('pending', 'approved', 'shipped', 'completed')
claimed_at        TIMESTAMPTZ
shipping_info     JSONB
delivery_method   TEXT
delivery_status   TEXT
delivery_data     JSONB
delivered_at      TIMESTAMPTZ
```

#### `status_tiers`
```sql
id                    UUID PRIMARY KEY
tier_name             TEXT (e.g., 'droplet', 'stream', 'river', 'delta', 'ocean')
display_name          TEXT
badge_emoji           TEXT
badge_color           TEXT
min_nctr_360_locked   INTEGER
max_nctr_360_locked   INTEGER
benefits              JSONB
sort_order            INTEGER
is_active             BOOLEAN
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

#### `wallet_portfolio`
```sql
id                UUID PRIMARY KEY
user_id           UUID (references unified_profiles)
wallet_address    TEXT
nctr_balance      NUMERIC
nctr_360_locked   NUMERIC
nctr_90_locked    NUMERIC
nctr_unlocked     NUMERIC
locks             JSONB
last_synced_at    TIMESTAMPTZ
sync_source       TEXT
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

### RLS Policies Summary

**Total Policies:** 77+ policies across all tables

| Table | Policy Types |
|-------|--------------|
| `admin_*` | Admin-only access via `has_role()` function |
| `profiles` | Users read/update own profile |
| `unified_profiles` | Users manage own, admins manage all |
| `rewards` | Public read for active, admin write |
| `rewards_claims` | Users read/create own, admin full access |
| `claim_gifts` | Sender/recipient access, admin full access |
| `sponsors` | Public read active, owner/admin write |
| `notifications` | User-specific read/update |
| `feedback` | User create, admin read |

**Key RLS Functions:**
- `has_role(user_id, role)` - Checks user_roles table
- `has_admin_permission(user_id, permission)` - Fine-grained admin permissions

### Database Functions (29 total)

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Trigger: Creates profile on auth signup |
| `generate_referral_code()` | Creates unique referral codes |
| `claim_reward(reward_id, shipping_info)` | Processes reward claims with tier pricing |
| `claim_gift(gift_code, user_id)` | Redeems gift codes |
| `admin_credit_claims(...)` | Admin: Credit claims to users |
| `admin_gift_reward(...)` | Admin: Gift rewards to users |
| `send_gift_from_balance(...)` | User-to-user gift sending |
| `cancel_gift(gift_id, user_id)` | Cancel pending gifts |
| `get_gift_stats()` | Aggregate gift statistics |
| `calculate_user_tier(user_id)` | Recalculates tier from portfolio |
| `get_unified_user_profile(auth_user_id)` | Comprehensive user data fetch |
| `get_user_with_tier(user_id)` | User + tier details |
| `get_member_reward_price(reward_id, tier)` | Tier-based pricing calculation |
| `get_sponsor_stats(sponsor_id)` | Sponsor analytics |
| `get_admin_stats()` | Admin dashboard stats |
| `get_admin_dashboard_stats()` | Extended admin stats |
| `get_recent_admin_activity(limit)` | Recent platform activity |
| `get_all_claims()` | Admin: All claims with details |
| `update_claim_status(claim_id, status)` | Admin: Update claim status |
| `update_claim_delivery_status(...)` | Admin: Update delivery status |
| `get_user_activity(user_id, limit)` | User activity feed |
| `get_user_wishlist(user_id)` | Wishlist with reward details |
| `get_wishlist_analytics()` | Wishlist popularity analytics |
| `get_user_share_analytics()` | Referral share analytics |
| `track_reward_conversion(code, reward_id)` | Track referral conversions |
| `submit_reward_version(...)` | Create new submission version |
| `notify_watchers_on_restock()` | Trigger: Stock alert notifications |
| `get_public_stats()` | Public platform statistics |
| `cleanup_expired_nonces()` | Maintenance: Clear auth nonces |

---

## 3. Authentication & User Flow

### Authentication Methods

1. **Email/Password Authentication**
   - Standard Supabase Auth
   - Auto-confirm enabled (no email verification in beta)
   - Sign up creates profile via `handle_new_user()` trigger

2. **Wallet Authentication (Web3)**
   - RainbowKit + Wagmi integration
   - Sign-in with Ethereum (SIWE) flow
   - Challenge/response via `wallet-auth` edge function
   - Supports Base network

### User Roles

| Role | Type | Description |
|------|------|-------------|
| `admin` | app_role enum | Full platform access |
| `moderator` | app_role enum | Limited admin access |
| Sponsor | Business logic | Linked via sponsors table |
| Regular User | Default | Standard member access |

### Admin Permissions (Fine-grained)

```typescript
type AdminPermission = 
  | 'rewards_view' | 'rewards_edit' | 'rewards_delete' | 'rewards_create'
  | 'claims_view' | 'claims_process' | 'claims_refund'
  | 'users_view' | 'users_edit' | 'users_ban'
  | 'submissions_view' | 'submissions_approve' | 'submissions_reject'
  | 'sponsors_view' | 'sponsors_edit'
  | 'brands_view' | 'brands_edit'
  | 'settings_view' | 'settings_edit'
  | 'admins_view' | 'admins_manage';
```

### Access Control Components
- `ProtectedRoute` - Requires authentication
- `AdminRoute` - Requires admin role
- `PermissionGate` - Requires specific admin permission

---

## 4. State Management

### Context Providers

| Context | Location | Purpose |
|---------|----------|---------|
| `AuthContext` | `src/contexts/AuthContext.tsx` | Auth state, modals, session |
| `UnifiedUserContext` | `src/contexts/UnifiedUserContext.tsx` | User profile, tier, portfolio |

### AuthContext State
```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authMode: 'signin' | 'signup';
  setAuthMode: (mode: 'signin' | 'signup') => void;
  showProfileCompletion: boolean;
  setShowProfileCompletion: (show: boolean) => void;
  walletAddress: string | null;
  needsProfileCompletion: boolean;
}
```

### UnifiedUserContext State
```typescript
interface UnifiedUserContextType {
  profile: UnifiedUser | null;
  tier: StatusTier | null;
  portfolio: WalletPortfolio | null;
  allTiers: StatusTier[];
  total360Locked: number;
  nextTier: StatusTier | null;
  progressToNextTier: number;
  loading: boolean;
  error: string | null;
  refreshUnifiedProfile: () => Promise<void>;
  updateUnifiedProfile: (updates: Partial<UnifiedProfile>) => Promise<void>;
  syncWalletPortfolio: (data: WalletPortfolioData) => Promise<void>;
}
```

### Additional State Management
- **React Query** (`@tanstack/react-query`) for server state
- **Local component state** via `useState`
- **Form state** via `react-hook-form` with `zod` validation

### Custom Hooks (26 total)
| Hook | Purpose |
|------|---------|
| `useAuth` | Legacy auth hook |
| `useAdminRole` | Admin role/permissions checking |
| `useAdminGifts` | Admin gift management |
| `useAdminNotifications` | Admin notification sending |
| `useClaimDeliveryNotifications` | Real-time delivery updates |
| `useClaimPriceFloor` | Calculate claim floor value |
| `useClaimValue` | Calculate claim USD value |
| `useCrescendoFavorites` | Favorites management |
| `useCrescendoNotifications` | User notifications |
| `useDataFetch` | Generic data fetching |
| `useDeliveryProfile` | Delivery profile CRUD |
| `useEarningOpportunities` | Earn page data |
| `useFavorites` | Reward favorites |
| `useGiftClaims` | Gift claiming logic |
| `useNCTRBalance` | NCTR balance calculations |
| `useNotifications` | Notification management |
| `usePortfolioSync` | Wallet portfolio sync |
| `useProfileCompletion` | Profile completion status |
| `useReferralSettings` | Referral program settings |
| `useReferralStats` | Referral analytics |
| `useSponsor` | Sponsor profile management |
| `useSponsorships` | Sponsorship data |
| `useWalletAuth` | Wallet authentication |
| `useWatchlist` | Stock alerts |
| `use-mobile` | Responsive breakpoint detection |
| `use-toast` | Toast notifications |

---

## 5. External Integrations

### Third-Party Services

| Service | Purpose | Status |
|---------|---------|--------|
| **Stripe** | Payment processing | ✅ Live (live keys configured) |
| **Userback** | User feedback widget | ✅ Configured (token: `A-CgAKnnPbKMeBZelCUa5I3ita5`) |
| **RainbowKit** | Wallet connection UI | ✅ Active |
| **Wagmi** | Ethereum interactions | ✅ Active |
| **Reown (WalletConnect)** | Wallet protocol | ⚠️ 403 errors on project config fetch |
| **Resend** | Email notifications | ⚠️ Partially configured (see TODOs) |

### Edge Functions (API Endpoints)

| Function | HTTP Methods | Purpose |
|----------|--------------|---------|
| `create-checkout-session` | POST | Create Stripe checkout session |
| `stripe-webhook` | POST | Handle Stripe webhooks |
| `create-stripe-products` | POST | Sync products to Stripe |
| `sync-packages-stripe` | POST | Sync claim packages |
| `wallet-auth` | POST | Wallet authentication flow |
| `merge-wallet-user` | POST | Merge wallet with existing user |
| `send-approval-notification` | POST | Notify on submission approval |
| `send-delivery-notification` | POST | Notify on delivery updates |
| `send-feedback-notification` | POST | Notify on feedback |
| `send-gift-notification` | POST | Notify on gift receipt |
| `send-purchase-confirmation` | POST | Confirm purchases |
| `send-submission-notification` | POST | Notify on new submissions |
| `submit-external-feedback` | POST | External feedback intake |
| `sync-crescendo-profiles` | POST | Cross-platform profile sync |
| `sync-garden-portfolio` | POST | Garden app portfolio sync |
| `generate-sweat-token-image` | POST | Generate token images |

---

## 6. Current Feature List

### Rewards System
| Feature | Status | Components | Notes |
|---------|--------|------------|-------|
| Browse rewards | ✅ Complete | RewardsPool, RewardCard | Filtering, search, categories |
| Reward detail view | ✅ Complete | RewardDetailPage | Full details, claiming |
| Claim rewards | ✅ Complete | ClaimConfirmationDialog | Tier-based pricing |
| Tier discounts | ✅ Complete | RewardPriceDisplay | Sponsors cover costs for higher tiers |
| Wishlist | ✅ Complete | WishlistPage | Save for later |
| Favorites | ✅ Complete | FavoritesPage | Quick access |
| Stock watchlist | ✅ Complete | useWatchlist | Get notified on restock |
| Submit reward ideas | ✅ Complete | SubmitRewardsPage | UGC pipeline |
| My submissions | ✅ Complete | MySubmissionsPage | Track submission status |
| Version history | ✅ Complete | RewardVersionHistory | Submission versioning |

### Claims & Purchases
| Feature | Status | Components | Notes |
|---------|--------|------------|-------|
| Buy claim passes | ✅ Complete | BuyClaims | Stripe integration |
| Gift claims | ✅ Complete | GiftClaimsPage | Send to others |
| Redeem gift codes | ✅ Complete | ClaimGiftPage | `/claim` route |
| Purchase history | ✅ Complete | PurchaseHistoryPage | Track purchases |
| My claims | ✅ Complete | ClaimsPage | Track claimed rewards |
| Delivery tracking | ✅ Complete | Delivery status in claims | Real-time updates |

### Membership & Status
| Feature | Status | Components | Notes |
|---------|--------|------------|-------|
| Status tiers | ✅ Complete | MembershipLevelPage | 5 tiers based on 360LOCK |
| Tier benefits | ✅ Complete | Status tier display | Discounts, access |
| Tier history | ✅ Complete | MembershipHistoryPage | Upgrade tracking |
| Portfolio sync | ✅ Complete | usePortfolioSync | Wallet balance sync |
| Tier celebration | ✅ Complete | TierUpgradeCelebration | Confetti animation |

### User Profile
| Feature | Status | Components | Notes |
|---------|--------|------------|-------|
| Profile management | ✅ Complete | ProfilePage | Name, avatar, bio |
| Delivery profile | ✅ Complete | DeliveryProfileForm | Shipping, socials |
| Wallet connection | ✅ Complete | WalletProfileCompletionModal | Web3 auth |
| Profile completion | ✅ Complete | useProfileCompletion | Onboarding progress |

### Referrals & Sharing
| Feature | Status | Components | Notes |
|---------|--------|------------|-------|
| Referral codes | ✅ Complete | ReferralCard | Auto-generated codes |
| Referral analytics | ✅ Complete | ReferralAnalyticsDashboard | Track conversions |
| Reward sharing | ✅ Complete | Share buttons | Social sharing |

### Sponsors
| Feature | Status | Components | Notes |
|---------|--------|------------|-------|
| Sponsor directory | ✅ Complete | SponsorsPage | Browse sponsors |
| Sponsor profiles | ✅ Complete | SponsorProfilePage | Detail pages |
| Sponsor application | ✅ Complete | BecomeASponsorPage | Apply form |
| Sponsor dashboard | ✅ Complete | SponsorDashboard | Manage sponsored rewards |
| Sponsored rewards | ✅ Complete | SponsoredBanner, SponsorBadge | Visual indicators |

### Admin Panel
| Feature | Status | Components | Notes |
|---------|--------|------------|-------|
| Admin dashboard | ✅ Complete | AdminDashboard | Overview stats |
| Manage rewards | ✅ Complete | AdminRewards | CRUD operations |
| Manage submissions | ✅ Complete | AdminSubmissions | Approve/reject |
| Manage claims | ✅ Complete | AdminClaims | Process, ship |
| Manage users | ✅ Complete | AdminUsers | View, edit users |
| Manage packages | ✅ Complete | AdminPackages | Claim packages |
| Manage sponsors | ✅ Complete | AdminSponsors | Sponsor management |
| Manage campaigns | ✅ Complete | AdminCampaigns | Campaign management |
| Send notifications | ✅ Complete | SendNotificationModal | User notifications |
| Gift claims | ✅ Complete | AdminGifts | Admin gift claims |
| Activity log | ✅ Complete | AdminActivityLog | Audit trail |
| Team management | ✅ Complete | AdminManagement | Admin users |
| Wishlist analytics | ✅ Complete | WishlistAnalytics | Popular items |
| Sync verification | ✅ Complete | AdminSyncVerification | Data sync checks |

### Earning Opportunities
| Feature | Status | Components | Notes |
|---------|--------|------------|-------|
| Earn page | ✅ Complete | EarnNCTR | Browse opportunities |
| Opportunity cards | ✅ Complete | EarningOpportunityCard | Individual items |
| Admin management | ✅ Complete | AdminEarningOpportunities | CRUD |

### Hidden/Paused Features
| Feature | Status | Notes |
|---------|--------|-------|
| Brand partnerships | 🔶 Hidden | Commented out in AppSidebar |
| Crescendo Brands page | 🔶 Hidden | Redirects to /rewards |
| Food & Beverage section | 🔶 Available but de-emphasized | Separate route exists |

---

## 7. Environment Variables

### Required Variables
| Variable | Purpose | Location |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase API URL | .env (auto-configured) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | .env (auto-configured) |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier | .env (auto-configured) |

### Secrets (Server-Side)
| Secret | Purpose | Status |
|--------|---------|--------|
| `LOVABLE_API_KEY` | Lovable platform | ✅ Auto-configured |
| `STRIPE_SECRET_KEY` | Stripe API | ✅ Configured |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | ✅ Configured |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend Stripe | ✅ Configured |
| `VITE_USERBACK_TOKEN` | Userback widget | ✅ Configured |
| `RESEND_API_KEY` | Email sending | ⚠️ Configured but not implemented |

---

## 8. Tech Stack Summary

### Core Framework
- **React 18.3.1** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety

### Routing & State
- **React Router DOM 6.30.1** - Client-side routing
- **TanStack React Query 5.90.9** - Server state management
- **React Hook Form 7.61.1** - Form handling
- **Zod 3.25.76** - Schema validation

### UI & Styling
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library (50+ components)
- **Radix UI** - Accessible primitives
- **Framer Motion 12.27.1** - Animations
- **Lucide React 0.462.0** - Icons
- **next-themes 0.3.0** - Dark/light mode

### Web3 Integration
- **RainbowKit 2.2.9** - Wallet connection UI
- **Wagmi 2.19.4** - React hooks for Ethereum
- **Viem 2.39.0** - Ethereum utilities

### Backend
- **Supabase** (via Lovable Cloud)
  - PostgreSQL database
  - Row Level Security
  - Edge Functions (Deno)
  - Real-time subscriptions
  - Auth (email + wallet)

### Payments
- **Stripe** - Payment processing (live mode)

### Additional Libraries
- **date-fns 3.6.0** - Date utilities
- **recharts 2.15.4** - Charts
- **canvas-confetti 1.9.4** - Celebrations
- **html2canvas 1.4.1** - Screenshots
- **jsPDF 4.0.0** - PDF generation
- **embla-carousel 8.6.0** - Carousels
- **sonner 1.7.4** - Toast notifications
- **vaul 0.9.9** - Drawer component

### Hosting
- **Lovable Cloud** - Deployment platform
- **Published URL:** https://crescendo-nctr-live.lovable.app

---

## 9. Known Issues & TODOs

### Code TODOs

#### Analytics Integration
```typescript
// src/lib/analytics.ts:50-54
// TODO: Send to analytics service
// Example: mixpanel.track(eventName, payload);
// Example: amplitude.logEvent(eventName, payload);
```

#### Email Notifications
```typescript
// supabase/functions/send-approval-notification/index.ts:5-7
// TODO: Add RESEND_API_KEY and implement email sending
// Currently only logs notifications
```

#### Hidden Features
```typescript
// src/components/AppSidebar.tsx:44-48
// HIDDEN FOR REWARDS-FOCUSED PHASE - TODO: Restore brand partnerships

// src/components/LandingPage.tsx:232-234
// TODO: Restore "Trusted By Leading Brands" section
```

### Console Warnings

1. **React Router Future Flags**
   - `v7_startTransition` warning
   - `v7_relativeSplatPath` warning
   - Action: Add future flags to BrowserRouter

2. **Reown/WalletConnect Configuration**
   - HTTP 403 on project config fetch
   - Falls back to local configuration
   - Non-blocking but indicates config issue

3. **Lit Dev Mode**
   - Development mode warning
   - Normal in dev, should not appear in production

### Security Linter Warning

- **Leaked Password Protection Disabled**
  - Supabase Auth setting
  - Recommendation: Enable in production

### Partially Implemented Features

1. **Email Notifications**
   - Edge functions exist but log only
   - Need Resend implementation

2. **Analytics Tracking**
   - Utility exists but logs to console
   - Need third-party service integration

3. **Brand Partnerships**
   - Components exist but hidden
   - Need business decision to re-enable

---

## 10. Recent Changes Summary

### Userback Integration (Latest)
- Simplified from complex initialization to standard script injection
- Removed custom FeedbackButton component
- Native Userback widget now loads automatically

### Architecture Patterns
- Lazy loading for all major routes
- Code splitting for admin panel
- ErrorBoundary wrappers for critical routes
- Skeleton loading states

### Active Beta Features
- Real-time claim delivery notifications
- Tier-based reward pricing
- Sponsor discount system
- Gift claims between users
- Admin notification system

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| React Components | 100+ |
| Custom Hooks | 26 |
| Database Tables | 30+ |
| RLS Policies | 77+ |
| Database Functions | 29 |
| Edge Functions | 17 |
| Page Routes | 30+ |
| Admin Views | 20+ |
| UI Components (shadcn) | 50+ |

---

*This document was auto-generated for external review. For questions or clarifications, refer to the source code or documentation in the `/docs` folder.*
