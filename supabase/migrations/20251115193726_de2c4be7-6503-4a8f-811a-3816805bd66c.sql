-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  level integer not null default 0,
  locked_nctr integer not null default 0,
  available_nctr integer not null default 100,
  claim_balance integer not null default 0,
  referral_code text unique,
  referred_by uuid references public.profiles(id),
  has_claimed_signup_bonus boolean not null default false,
  has_status_access_pass boolean not null default false,
  wallet_address text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create RLS policies
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Create function to generate unique referral code
create or replace function public.generate_referral_code()
returns text
language plpgsql
security definer
as $$
declare
  code text;
  exists boolean;
begin
  loop
    -- Generate code like CRES-A7X9K2
    code := 'CRES-' || upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    select exists(select 1 from public.profiles where referral_code = code) into exists;
    
    exit when not exists;
  end loop;
  
  return code;
end;
$$;

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, 
    email, 
    full_name,
    referral_code,
    available_nctr,
    claim_balance
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    generate_referral_code(),
    100, -- Signup bonus
    0
  );
  return new;
end;
$$;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create trigger for updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Create referrals tracking table
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  referral_bonus integer not null default 500,
  is_paid boolean not null default false,
  created_at timestamp with time zone not null default now(),
  unique(referrer_id, referred_id)
);

-- Enable RLS for referrals
alter table public.referrals enable row level security;

-- RLS policies for referrals
create policy "Users can view their own referrals"
  on public.referrals
  for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

create policy "System can insert referrals"
  on public.referrals
  for insert
  with check (true);
