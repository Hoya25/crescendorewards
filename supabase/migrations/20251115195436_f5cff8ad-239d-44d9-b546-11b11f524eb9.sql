-- Create function to get user's task progress
create or replace function public.get_user_task_progress()
returns table (
  task_id uuid,
  task_type text,
  title text,
  description text,
  reward_amount integer,
  icon text,
  link text,
  recurring boolean,
  is_completed boolean,
  completed_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  return query
  select 
    t.id as task_id,
    t.task_type,
    t.title,
    t.description,
    t.reward_amount,
    t.icon,
    t.link,
    t.recurring,
    case 
      when t.recurring then 
        exists(
          select 1 from user_task_completions c 
          where c.user_id = v_user_id 
          and c.task_id = t.id 
          and date(c.completed_at) = current_date
        )
      else 
        exists(
          select 1 from user_task_completions c 
          where c.user_id = v_user_id 
          and c.task_id = t.id
        )
    end as is_completed,
    (
      select max(c.completed_at) 
      from user_task_completions c 
      where c.user_id = v_user_id 
      and c.task_id = t.id
    ) as completed_at
  from earn_tasks t
  where t.is_active = true
  order by 
    case t.task_type
      when 'daily' then 1
      when 'social' then 2
      when 'referral' then 3
      when 'challenge' then 4
      when 'partner' then 5
    end,
    t.created_at;
end;
$$;
