# Narrow anon table privileges on the last five wide tables

Defaults A and B are now applied: newly created functions and tables in the public schema no longer auto-grant to the unauthenticated role. This plan covers the five pre-existing tables that still carry full unauthenticated DML.

All five are RLS-protected today, so nothing is currently exposed. This is defence-in-depth: removing the grant means a future policy mistake cannot become an anonymous write.

## Current state (verified in-database)

Every one of the five carries the identical legacy grant to the unauthenticated role: full read, insert, update, delete, truncate, references, trigger. No `PUBLIC` privilege remains on any of them.

| Table | What RLS allows unauthenticated visitors today | What a policy slip would expose without the grant removed |
|---|---|---|
| `profiles` | Nothing. All five policies resolve through `auth.uid()` or the admin role, both null for anonymous callers. | Legacy balances, email, wallet address, referral code — read and write. |
| `unified_profiles` | Nothing, and it is explicit: a dedicated deny-all read policy targets the anonymous role; every other policy is scoped to signed-in users. | Canonical member identity and balance record. |
| `content_submissions` | Nothing. All three policies target signed-in users only. | Submitter source ids and unpublished submissions; anonymous content injection. |
| `gear_vault_items` | Read of rows with status `available` — the read policy targets `public`, so this one genuinely serves anonymous readers. Writes are signed-in only, plus a trigger that blocks client-side economic writes. | Contributor and claimer ids; forged gear listings. |
| `nctr_deposits` | Nothing. Both policies scope to `auth.uid()`. | Deposit ledger rows — value-bearing. |

## What narrowing to read-only would surface

- `profiles`, `unified_profiles`, `content_submissions`, `nctr_deposits`: nothing. No anonymous-visible policy exists on any of them, so read-only is already the effective ceiling and even reads return zero rows. Safe to go further than read-only here and revoke the anonymous grant outright.
- `gear_vault_items`: read-only is the correct landing spot, not a full revoke. The public gear listing is served to anonymous visitors through the `public`-role read policy; dropping read would blank it. Write privileges are unused by any anonymous path.

## Proposed change

One migration, two statements per table:

```sql
-- No anonymous policy exists on these four; revoke the grant entirely.
REVOKE ALL ON public.profiles            FROM anon;
REVOKE ALL ON public.unified_profiles    FROM anon;
REVOKE ALL ON public.content_submissions FROM anon;
REVOKE ALL ON public.nctr_deposits       FROM anon;

-- Public gear listing stays readable; drop everything else.
REVOKE ALL     ON public.gear_vault_items FROM anon;
GRANT  SELECT  ON public.gear_vault_items TO   anon;
```

Signed-in and service-role grants are untouched, so no app code path changes.

## Verification after applying

1. Re-read `relacl` on all five and confirm the anonymous role holds only `SELECT` on `gear_vault_items` and nothing elsewhere.
2. Anonymous client probe: gear vault listing still returns available items; reads of the other four return a permission error rather than an empty set.
3. Signed-in walkthrough on the test fixture: profile load, unified profile load, content submission, deposit history, gear vault claim — all unchanged.
4. Build and typecheck (no frontend change expected).

## Risk

Low. The only behaviour that could regress is an anonymous surface reading one of the four tables without a matching policy — impossible today, since RLS already returns nothing for those callers. Fully reversible by re-granting.
