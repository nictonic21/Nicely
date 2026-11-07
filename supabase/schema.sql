-- Nicely database schema.
--
-- Run this ONCE in the Nicely Supabase project:
-- Supabase dashboard -> your Nicely project -> SQL Editor -> New query ->
-- paste this whole file -> Run.
--
-- Privacy by design: we never store what people write. The rewrites table
-- only records THAT a rewrite happened (for counting against the plan),
-- never the message itself.

-- 1. users ------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text check (plan in ('starter', 'plus', 'unlimited')),
  payment_status text not null default 'none', -- none | active | past_due | cancelled
  stripe_customer_id text unique,
  stripe_subscription_id text,
  period_start timestamptz,                    -- start of the current billing month
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- People can read their own row. Nobody can write it from the browser:
-- only the server (service role) changes plans, so a plan cannot be faked.
drop policy if exists "users select own" on public.users;
create policy "users select own" on public.users
  for select using (auth.uid() = id);

-- 2. rewrites (usage log, no message content) --------------------------------
create table if not exists public.rewrites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tone text,
  recipient text,
  created_at timestamptz not null default now()
);

create index if not exists rewrites_user_created_idx
  on public.rewrites (user_id, created_at desc);

alter table public.rewrites enable row level security;
-- No policies: only the server reads and writes this table.

-- 3. Create a users row automatically when someone signs up ------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Claim one rewrite, safely ------------------------------------------------
-- Locks the person's row so two tabs (or a double-click) cannot both slip
-- past the limit. Checks a short burst limit, then the plan limit, then
-- records the rewrite. The server passes the limit and the period start, so
-- the plan rules live in ONE place (src/lib/plans.ts).
create or replace function public.claim_rewrite(
  p_user uuid,
  p_since timestamptz,
  p_limit integer,
  p_burst integer,
  p_tone text,
  p_recipient text
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_used integer;
  v_recent integer;
  v_id uuid;
begin
  perform 1 from public.users where id = p_user for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_account');
  end if;

  select count(*) into v_recent from public.rewrites
    where user_id = p_user and created_at > now() - interval '1 minute';
  if v_recent >= p_burst then
    return jsonb_build_object('ok', false, 'reason', 'slow_down');
  end if;

  select count(*) into v_used from public.rewrites
    where user_id = p_user and created_at >= p_since;
  if v_used >= p_limit then
    return jsonb_build_object('ok', false, 'reason', 'limit', 'used', v_used);
  end if;

  insert into public.rewrites (user_id, tone, recipient)
    values (p_user, p_tone, p_recipient)
    returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'used', v_used + 1);
end;
$$;

-- Only the server may call it.
revoke all on function public.claim_rewrite(uuid, timestamptz, integer, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_rewrite(uuid, timestamptz, integer, integer, text, text)
  to service_role;
