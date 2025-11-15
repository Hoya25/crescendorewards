-- Fix security warnings by setting search_path on all functions

-- Update generate_referral_code function with search_path
create or replace function public.generate_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
  exists boolean;
begin
  loop
    code := 'CRES-' || upper(substring(md5(random()::text) from 1 for 6));
    select exists(select 1 from public.profiles where referral_code = code) into exists;
    exit when not exists;
  end loop;
  return code;
end;
$$;

-- Update handle_updated_at function with search_path
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
