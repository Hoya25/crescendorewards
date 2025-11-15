-- Create rewards table
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('alliance_tokens', 'experiences', 'merch', 'gift_cards')),
  cost integer not null check (cost >= 0),
  image_url text,
  stock_quantity integer,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create rewards_claims table
create table public.rewards_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  reward_id uuid references public.rewards(id) on delete cascade not null,
  claimed_at timestamp with time zone not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'shipped', 'completed')),
  shipping_info jsonb
);

-- Enable RLS
alter table public.rewards enable row level security;
alter table public.rewards_claims enable row level security;

-- RLS Policies for rewards
create policy "Anyone can view active rewards"
  on public.rewards
  for select
  using (is_active = true);

create policy "System can manage rewards"
  on public.rewards
  for all
  using (auth.role() = 'service_role');

-- RLS Policies for rewards_claims
create policy "Users can view their own claims"
  on public.rewards_claims
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own claims"
  on public.rewards_claims
  for insert
  with check (auth.uid() = user_id);

-- Create function to claim reward
create or replace function public.claim_reward(
  p_reward_id uuid,
  p_shipping_info jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_reward_cost integer;
  v_user_balance integer;
  v_stock integer;
  v_claim_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;
  
  -- Get reward details
  select cost, stock_quantity into v_reward_cost, v_stock
  from rewards
  where id = p_reward_id and is_active = true;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Reward not found or inactive');
  end if;
  
  -- Check stock
  if v_stock is not null and v_stock <= 0 then
    return jsonb_build_object('success', false, 'error', 'Out of stock');
  end if;
  
  -- Get user balance
  select claim_balance into v_user_balance
  from profiles
  where id = v_user_id;
  
  if v_user_balance < v_reward_cost then
    return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;
  
  -- Deduct balance
  update profiles
  set claim_balance = claim_balance - v_reward_cost
  where id = v_user_id;
  
  -- Update stock
  if v_stock is not null then
    update rewards
    set stock_quantity = stock_quantity - 1
    where id = p_reward_id;
  end if;
  
  -- Create claim
  insert into rewards_claims (user_id, reward_id, shipping_info)
  values (v_user_id, p_reward_id, p_shipping_info)
  returning id into v_claim_id;
  
  return jsonb_build_object(
    'success', true, 
    'claim_id', v_claim_id,
    'new_balance', v_user_balance - v_reward_cost
  );
end;
$$;

-- Create trigger for updated_at
create trigger update_rewards_updated_at
  before update on public.rewards
  for each row
  execute function public.handle_updated_at();

-- Seed some initial rewards
insert into public.rewards (title, description, category, cost, image_url, stock_quantity) values
  ('100 Alliance Tokens', 'Boost your alliance power with 100 tokens', 'alliance_tokens', 500, null, null),
  ('500 Alliance Tokens', 'Massive alliance boost with 500 tokens', 'alliance_tokens', 2000, null, null),
  ('VIP Concert Experience', 'Exclusive backstage pass and meet & greet', 'experiences', 5000, null, 5),
  ('Gaming Setup Upgrade', 'Premium gaming accessories package', 'experiences', 3000, null, 10),
  ('Limited Edition T-Shirt', 'Crescendo exclusive merchandise', 'merch', 800, null, 50),
  ('Premium Hoodie', 'High-quality branded hoodie', 'merch', 1500, null, 30),
  ('$10 Amazon Gift Card', 'Instant digital delivery', 'gift_cards', 1000, null, null),
  ('$25 Steam Gift Card', 'For your gaming needs', 'gift_cards', 2400, null, null),
  ('$50 Visa Gift Card', 'Use anywhere Visa is accepted', 'gift_cards', 4800, null, 100);