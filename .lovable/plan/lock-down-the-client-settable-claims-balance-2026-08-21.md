# Lock down the client-settable Claims balance

Claims are dollar-denominated purchasing power, and today a member's balance lives in a JSON key (`crescendo_data.claims_balance`) that members can write directly. Two features currently spend Claims by writing that key from the browser, which means the same path can be used to *raise* the balance.

## What's exploitable today

Both spend paths in `src/hooks/useGroundballStatus.ts` do the same thing: read the balance from the profile, subtract a constant, and write the whole `crescendo_data` object back.

- Paid reward swap — 25 Claims (`swapReward`)
- Bonus selection slot — 50 Claims (`purchaseBonusSlot`)

Because the write is a plain profile update, a member can send any number instead of `balance - cost`, and can also overwrite other keys inside `crescendo_data` in the same request. Affordability is checked in the browser only.

## Behavior changes you should know about before we touch anything

1. **Spends become atomic and server-priced.** Costs (25 / 50) move server-side. If someone has edited a stale client bundle or two tabs race, the second spend now fails cleanly instead of double-applying.
2. **Failure timing shifts.** Today the Claims deduction happens first and the slot/selection update second, so a mid-flight error can debit Claims without granting anything. After the change both happen in one transaction — either both land or neither does.
3. **Error copy changes for insufficient balance.** The server becomes the authority, so a member with a stale UI can see "Insufficient Claims" after clicking rather than having the button pre-disabled. UI pre-checks stay, but they become a hint, not the gate.
4. **No change to Stripe purchases.** `stripe-webhook` already credits Claims with the service role and keeps working.
5. **Admin credits/gifts unchanged.** `admin_credit_claims`, `send_gift_from_balance`, and `claim_gift` are already `SECURITY DEFINER` RPCs.

## Technical approach

**New RPCs (`SECURITY DEFINER`, `search_path = public`), costs defined in SQL:**

- `groundball_swap_reward(p_selection_id uuid, p_use_free_swap boolean)` — resolves the caller's profile from `auth.uid()`, loads the selection and verifies ownership, decides free vs paid (give-back rewards are always free), debits 25 Claims when paid, deactivates the selection, and decrements `selections_used` / `free_swaps_remaining` in one transaction. Returns the new balance and swap state as JSON.
- `groundball_purchase_bonus_slot()` — debits 50 Claims, then inserts or increments `member_groundball_status.bonus_selections`. Returns the new balance and slot count.

Both write the balance by merging only the `claims_balance` key (`crescendo_data || jsonb_build_object(...)`) so no other key can be clobbered, and both raise on insufficient funds.

**Lock the JSON key:** extend the existing `block_client_financial_writes` trigger on `unified_profiles` so a non-service-role update that changes `crescendo_data->>'claims_balance'` (or the legacy `claim_balance`) is rejected. Other `crescendo_data` keys stay writable, since profile/preferences updates use them.

**Client changes** — `src/hooks/useGroundballStatus.ts` only: `swapReward` and `purchaseBonusSlot` call the new RPCs instead of updating `unified_profiles`, then invalidate the groundball queries and refresh the unified profile as they do now. Toast copy and the affordability hints stay as-is.

## Verification

- Confirm a simulated authenticated update that raises `claims_balance` is rejected by the trigger, and that an unrelated `crescendo_data` key still saves.
- Run a paid swap, a free swap, a give-back swap, and a bonus-slot purchase end to end; check the balance moves by exactly 25 / 0 / 0 / 50 and the slot counters match.
- Attempt a spend with an insufficient balance and confirm it fails without partial state.
