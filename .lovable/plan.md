# Close the RPC-bypass write paths

Governing rule applied throughout: any value that determines money, standing or access is written only by a server path that derives it. The client reads and displays.

## Audit first (already run, read-only)

| Table | Rows | Findings |
| --- | --- | --- |
| `rewards_claims` | 0 | Clean. No claim rows exist at all, so the self-INSERT path was never used. |
| `member_groundball_status` | 1 | One row (member `08049d32…`, gold, used 5 / max 7 / bonus 2 / free swaps 3). `updated_at` is byte-identical to `created_at`, so the row has never been updated since insert — the counters are seed values, not self-granted. No Claims debit is expected or missing. Clean. |
| `member_reward_selections` | 10 | Member `08049d32…`: 5 selections (Jan 9–26). Member `723222d9…`: 5 selections inserted Feb 8, ~10 seconds apart, and that member has **no** `member_groundball_status` row at all — so those five selections were written by the client insert path with no slot accounting and no swap charge behind them. Not an exploit of a paid action (no swaps, no bonus slots, nothing chargeable happened), but the state cannot be traced to any RPC. Flagged as **not traceable**, not as theft. |
| `gear_vault_items` | 0 | Clean. The over-broad UPDATE policy was never exercised because the table is empty. |
| `nctr_deposits` | 1 row; `check_ins`, `contributed_reward_earnings`, `membership_history` | 0 rows each | The single deposit is a `pending` self-submitted tx hash awaiting admin verification — the intended flow. |

No claim, swap counter, bonus slot or gear vault item was created outside a legitimate path. The only untraceable state is the 10 `member_reward_selections` rows, which are untraceable by design (that insert is a client path today), and the 5 belonging to `723222d9…` sit outside any slot ledger.

## Changes

### 1. `rewards_claims` — RPC-only creation
- Drop the `Users can create their own claims` INSERT policy and `REVOKE INSERT ON public.rewards_claims FROM authenticated`.
- Keep member SELECT of own claims, keep the admin policies (admin gifting from `AdminRewards` uses the admin path), keep `service_role` full access so `process-claim` and `claim_reward` keep working.
- `claim_reward` is `SECURITY DEFINER` and `process-claim` uses the service-role client, so both are unaffected.
- No client code writes this table today, so nothing in the UI breaks.

### 2. `member_groundball_status` — counters become server-only
- Add a `block_groundball_counter_writes` `BEFORE UPDATE` trigger (`SECURITY INVOKER`, same pattern as `block_client_financial_writes`): if the caller is not `service_role` and not inside a definer RPC, reject any change to `bonus_selections`, `free_swaps_remaining`, `selections_max`, `status_tier`, `groundball_locked`.
- `selections_used` moves server-side too, because it gates access to slots. That means the `selectReward` mutation can no longer bump it from the client.
- Revoke INSERT from `authenticated` and drop the member INSERT policy — a status row is provisioned by server logic, never self-created.

### 3. `member_reward_selections` — selection through an RPC
- New `groundball_select_reward(p_reward_id uuid)` `SECURITY DEFINER` RPC that, in one transaction: verifies the caller owns the status row, enforces the tier requirement, enforces free slots (give-back rewards exempt, matching current behavior), inserts the selection and increments `selections_used`.
- Revoke INSERT/UPDATE/DELETE from `authenticated`; keep SELECT of own rows. Redemption (`RedemptionModal`'s `last_redeemed_at` / `redemption_count` bump) moves into a small `groundball_redeem_selection` RPC alongside the `reward_redemptions` insert, since it too is currently a client update on this table.
- `useGroundballStatus.selectReward` and `RedemptionModal` switch to the RPCs. Behavior members see is unchanged; the errors now come from the server.

### 4. `gear_vault_items` — fix the policy
- Replace `Authenticated users can claim available items` (UPDATE, no ownership condition) with a claim RPC: `gear_vault_claim_item(p_item_id uuid)` sets `status='claimed'`, `claimed_by`, `claimed_at` only when the item is still `available`, and enforces the bronze-status requirement the UI shows.
- Keep `Contributors can update their own pending items` (that one is correctly own-row) and revoke the blanket UPDATE grant path.

### 5. The four self-INSERT tables — recommendation
My read, for your decision:
- `nctr_deposits` — **keep the client INSERT.** This is a member declaring "I sent this tx hash"; it carries no credited value (`amount_nctr` is written as 0 and admin verification sets the real amount). What must be locked instead: `amount_nctr`, `status`, `lock_type`, `credited_at` should be guarded so a member cannot self-credit a deposit or self-approve one. The withdrawal-request update stays.
- `membership_history` — **server-only.** It is the standing ledger. Its INSERT policy is already named "System can insert"; the grant just doesn't match the intent. Revoke.
- `check_ins` — **server-only.** `perform_daily_checkin` is a definer RPC that awards NCTR; a direct insert forges streak state. Revoke.
- `contributed_reward_earnings` — **server-only.** Pure money. Revoke.

So: revoke three, and harden `nctr_deposits` columns rather than revoking it. Say the word if you want deposits locked down entirely instead.

## Verification after applying
Signed in as an authenticated non-admin, confirm each of these is rejected and reports no partial state: direct claim insert, counter self-update, selection insert/update, gear item claim on someone else's row, `check_ins` / `membership_history` / `contributed_reward_earnings` insert, and a `nctr_deposits` insert carrying a nonzero `amount_nctr` or `status='verified'`. Then confirm the legitimate flows still work: swap (free and 15-Claim paid), bonus slot (25 Claims), select a reward, redeem a selection, submit a deposit.
