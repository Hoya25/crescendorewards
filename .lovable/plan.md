# Harden Group A and active benefits

## Scope

1. Replace the four member-used Group A functions with authenticated-only signatures:
   - `perform_daily_checkin()` derives the auth user from `auth.uid()` and keeps the fixed 1,500 NCTR award server-side.
   - `process_referral(p_referrer_code)` derives the referred member from `auth.uid()` and keeps the fixed referral award server-side.
   - `validate_and_claim_bounty(p_bounty_id, p_submission_url, p_submission_notes)` derives both auth and unified-profile IDs from `auth.uid()`.
   - `claim_gift(p_gift_code)` derives the recipient from `auth.uid()` and credits only the stored gift amount.
   - Revoke anonymous execution on all replacements; allow authenticated execution only for these member actions and service-role execution for trusted backend work.

2. Remove `calculate_nctr_reward` rather than preserve an unsafe generic calculator:
   - It has no application or database callers.
   - It accepts caller-supplied base amount and merchandise status, so there is no authoritative server record from which this generic function can derive a reward.
   - Dropping it removes both its identity parameter and the caller-controlled value path; future reward writers must calculate from their own authoritative purchase, bounty, or contribution row.

3. Make `member_active_benefits` RPC-write-only for members:
   - Revoke direct member create/edit/delete privileges.
   - Add authenticated `activate_member_benefit(...)` and `deactivate_member_benefit(...)` functions that derive the member, tier slot allowance, partner slot cost, activation status, timestamps, and lifecycle fields server-side.
   - Accept only creator-selection details that are genuinely member input.
   - Keep admins/service-role able to fulfill benefits and set redemption codes through trusted paths.
   - Update both existing activation callers and the existing deactivation hook to use these RPCs.

4. Update frontend callers:
   - `useCheckinStreak.ts`: call check-in with no user ID.
   - `useGiftClaims.ts`: submit only the gift code.
   - `useBountyValidation.ts`: submit only bounty details.
   - `useAlliancePartners.ts` and `ActivateBenefitModal.tsx`: use benefit lifecycle RPCs instead of table writes.
   - `process_referral` and `calculate_nctr_reward` have no frontend callers today.

5. Verify:
   - Confirm final function signatures and EXECUTE grants.
   - Test anonymous denial and authenticated ownership boundaries where a signed-in test session is available.
   - Run the TypeScript-only typecheck and inspect the current build signal.
   - Audit check-ins, referrals, bounty claims, gift claims, and NCTR credit records against their source records; report each area as clean, exploited, or not determinable, including member, amount, and timestamp for anomalies.

## Technical detail

The benefits table is made RPC-write-only instead of using a column guard because activation rows contain multiple coupled server-derived fields (`status`, timestamps, slot cost, redemption lifecycle, and usage totals). A trigger protecting only three columns would still leave members able to forge or delete the surrounding lifecycle record and would duplicate validation across insert/update paths.
