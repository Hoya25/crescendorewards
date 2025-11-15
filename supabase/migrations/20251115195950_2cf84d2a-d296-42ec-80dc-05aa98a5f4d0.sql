-- Create user roles enum
create type public.app_role as enum ('admin', 'moderator', 'user');

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, role)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS policies for user_roles
create policy "Users can view their own roles"
  on public.user_roles
  for select
  using (auth.uid() = user_id);

create policy "Admins can manage all roles"
  on public.user_roles
  for all
  using (public.has_role(auth.uid(), 'admin'));

-- Update rewards RLS for admin management
create policy "Admins can manage all rewards"
  on public.rewards
  for all
  using (public.has_role(auth.uid(), 'admin'));

-- Update rewards_claims RLS for admin management
create policy "Admins can view all claims"
  on public.rewards_claims
  for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all claims"
  on public.rewards_claims
  for update
  using (public.has_role(auth.uid(), 'admin'));

-- Function to get admin dashboard stats
create or replace function public.get_admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_stats jsonb;
begin
  v_user_id := auth.uid();
  
  -- Check if user is admin
  if not public.has_role(v_user_id, 'admin') then
    raise exception 'Unauthorized: Admin access required';
  end if;
  
  select jsonb_build_object(
    'total_rewards', (select count(*) from rewards),
    'active_rewards', (select count(*) from rewards where is_active = true),
    'total_claims', (select count(*) from rewards_claims),
    'pending_claims', (select count(*) from rewards_claims where status = 'pending'),
    'approved_claims', (select count(*) from rewards_claims where status = 'approved'),
    'shipped_claims', (select count(*) from rewards_claims where status = 'shipped'),
    'completed_claims', (select count(*) from rewards_claims where status = 'completed'),
    'total_users', (select count(*) from profiles),
    'total_nctr_distributed', (select coalesce(sum(available_nctr + locked_nctr), 0) from profiles),
    'total_claim_balance', (select coalesce(sum(claim_balance), 0) from profiles)
  ) into v_stats;
  
  return v_stats;
end;
$$;

-- Function to get all claims with user details (admin only)
create or replace function public.get_all_claims()
returns table (
  claim_id uuid,
  user_id uuid,
  user_email text,
  user_name text,
  reward_id uuid,
  reward_title text,
  reward_cost integer,
  status text,
  claimed_at timestamp with time zone,
  shipping_info jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  -- Check if user is admin
  if not public.has_role(v_user_id, 'admin') then
    raise exception 'Unauthorized: Admin access required';
  end if;
  
  return query
  select 
    rc.id as claim_id,
    rc.user_id,
    p.email as user_email,
    p.full_name as user_name,
    rc.reward_id,
    r.title as reward_title,
    r.cost as reward_cost,
    rc.status,
    rc.claimed_at,
    rc.shipping_info
  from rewards_claims rc
  join profiles p on p.id = rc.user_id
  join rewards r on r.id = rc.reward_id
  order by rc.claimed_at desc;
end;
$$;

-- Function to update claim status (admin only)
create or replace function public.update_claim_status(
  p_claim_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  -- Check if user is admin
  if not public.has_role(v_user_id, 'admin') then
    return jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  end if;
  
  -- Validate status
  if p_status not in ('pending', 'approved', 'shipped', 'completed') then
    return jsonb_build_object('success', false, 'error', 'Invalid status');
  end if;
  
  -- Update claim
  update rewards_claims
  set status = p_status
  where id = p_claim_id;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Claim not found');
  end if;
  
  return jsonb_build_object('success', true, 'message', 'Claim status updated');
end;
$$;

-- Add trigger for user_roles updated_at if needed
create trigger update_user_roles_updated_at
  before update on public.user_roles
  for each row
  execute function public.handle_updated_at();