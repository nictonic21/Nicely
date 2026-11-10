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
  period_start timestamptz,                    -- start of the current billing period
  email_opt_out boolean not null default false, -- no tips / reminder emails
  welcome_sent_at timestamptz,
  free_nudge_sent_at timestamptz,
  limit_nudge_for timestamptz,                 -- which month the "nearly out" email was for
  created_at timestamptz not null default now()
);

-- Safe to re-run on an older copy of this table.
alter table public.users add column if not exists email_opt_out boolean not null default false;
alter table public.users add column if not exists welcome_sent_at timestamptz;
alter table public.users add column if not exists free_nudge_sent_at timestamptz;
alter table public.users add column if not exists limit_nudge_for timestamptz;

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
  input_hash text,                     -- one-way fingerprint, not the words
  refines integer not null default 0,  -- free one-tap tweaks used
  created_at timestamptz not null default now()
);

alter table public.rewrites add column if not exists input_hash text;
alter table public.rewrites add column if not exists refines integer not null default 0;
-- Thumbs up/down on a rewrite: just the rating and a reason from a fixed
-- list, never the words.
alter table public.rewrites add column if not exists rating smallint check (rating in (-1, 1));
alter table public.rewrites add column if not exists rating_reason text
  check (rating_reason in ('too_long', 'wrong_tone', 'missed_point', 'robotic', 'other'));

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
drop function if exists public.claim_rewrite(uuid, timestamptz, integer, integer, text, text);
create or replace function public.claim_rewrite(
  p_user uuid,
  p_since timestamptz,
  p_limit integer,
  p_burst integer,
  p_tone text,
  p_recipient text,
  p_input_hash text
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

  insert into public.rewrites (user_id, tone, recipient, input_hash)
    values (p_user, p_tone, p_recipient, p_input_hash)
    returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'used', v_used + 1);
end;
$$;

-- Only the server may call it.
revoke all on function public.claim_rewrite(uuid, timestamptz, integer, integer, text, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_rewrite(uuid, timestamptz, integer, integer, text, text, text)
  to service_role;

-- 5. One-tap tweaks ------------------------------------------------------------
-- Each rewrite comes with a few free tweaks ("Shorter", "Softer"...). This
-- uses one, atomically, only for the person's own recent rewrite of the SAME
-- words, so a tweak can't be used as a free new rewrite.
drop function if exists public.use_refine(uuid, uuid, text, integer);
create or replace function public.use_refine(
  p_user uuid,
  p_id uuid,
  p_input_hash text,
  p_max integer,          -- free tweaks per message
  p_since timestamptz,    -- start of this month's allowance
  p_month_cap integer     -- free tweaks per month in total (keeps AI costs bounded)
)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_month integer;
  v_hit integer;
begin
  perform 1 from public.users where id = p_user for update;
  select coalesce(sum(refines), 0) into v_month from public.rewrites
    where user_id = p_user and created_at >= p_since;
  if v_month >= p_month_cap then
    return 'month_cap';
  end if;
  update public.rewrites
     set refines = refines + 1
   where id = p_id
     and user_id = p_user
     and input_hash = p_input_hash
     and refines < p_max
     and created_at > now() - interval '2 hours';
  get diagnostics v_hit = row_count;
  return case when v_hit > 0 then 'ok' else 'used' end;
end;
$$;

revoke all on function public.use_refine(uuid, uuid, text, integer, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.use_refine(uuid, uuid, text, integer, timestamptz, integer) to service_role;

-- Gives a tweak back if the AI step failed.
create or replace function public.give_back_refine(p_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.rewrites set refines = greatest(refines - 1, 0) where id = p_id;
$$;

revoke all on function public.give_back_refine(uuid) from public, anon, authenticated;
grant execute on function public.give_back_refine(uuid) to service_role;

-- 6. Free try on the home page (no account) -------------------------------------
-- Stores a salted one-way hash of the visitor's IP address, never the
-- address itself, and never what they wrote.
create table if not exists public.trial_uses (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists trial_uses_ip_idx on public.trial_uses (ip_hash, created_at desc);
create index if not exists trial_uses_created_idx on public.trial_uses (created_at desc);
alter table public.trial_uses enable row level security;
-- No policies: only the server reads and writes this table.

create or replace function public.claim_trial(
  p_ip_hash text,
  p_per_ip integer,
  p_daily_cap integer
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_ip integer;
  v_all integer;
  v_id bigint;
begin
  -- One at a time, so the daily cap can't be overshot.
  perform pg_advisory_xact_lock(4242);
  -- Keep only a week of these, for privacy.
  delete from public.trial_uses where created_at < now() - interval '7 days';
  select count(*) into v_ip from public.trial_uses
    where ip_hash = p_ip_hash and created_at > now() - interval '24 hours';
  if v_ip >= p_per_ip then
    return jsonb_build_object('ok', false, 'reason', 'used');
  end if;
  select count(*) into v_all from public.trial_uses
    where created_at > now() - interval '24 hours';
  if v_all >= p_daily_cap then
    return jsonb_build_object('ok', false, 'reason', 'busy');
  end if;
  insert into public.trial_uses (ip_hash) values (p_ip_hash) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.claim_trial(text, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_trial(text, integer, integer) to service_role;

-- 7. General rate limiter (contact form and similar) ---------------------------
-- Counts recent hits for a key (e.g. a hashed IP) and refuses once the limit
-- for the time window is reached. Stores no personal data in plain form.
create table if not exists public.rate_hits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_hits_key_idx on public.rate_hits (key, created_at desc);
alter table public.rate_hits enable row level security;
-- No policies: only the server reads and writes this table.

create or replace function public.hit_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));
  delete from public.rate_hits where created_at < now() - interval '2 days';
  select count(*) into v_count from public.rate_hits
    where key = p_key and created_at > now() - make_interval(secs => p_window_seconds);
  if v_count >= p_max then
    return false;
  end if;
  insert into public.rate_hits (key) values (p_key);
  return true;
end;
$$;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- 8. Owner dashboard numbers -----------------------------------------------------
-- Counts only, for the private /admin page. Days are UK days.
create or replace function public.admin_stats()
returns jsonb
language sql
security definer set search_path = public
as $$
  with today as (select date_trunc('day', now() at time zone 'Europe/London') as d)
  select jsonb_build_object(
    'users_total',    (select count(*) from public.users),
    'signups_7d',     (select count(*) from public.users where created_at > now() - interval '7 days'),
    'signups_30d',    (select count(*) from public.users where created_at > now() - interval '30 days'),
    'paying',         (select coalesce(jsonb_object_agg(plan, n), '{}'::jsonb) from (
                         select plan, count(*) n from public.users
                          where payment_status in ('active', 'past_due') and plan is not null
                          group by plan) t),
    'past_due',       (select count(*) from public.users where payment_status = 'past_due'),
    'active_users_7d',(select count(distinct user_id) from public.rewrites where created_at > now() - interval '7 days'),
    'messages_today', (select count(*) from public.rewrites, today
                        where (created_at at time zone 'Europe/London') >= today.d),
    'messages_7d',    (select count(*) from public.rewrites where created_at > now() - interval '7 days'),
    'messages_30d',   (select count(*) from public.rewrites where created_at > now() - interval '30 days'),
    'tweaks_30d',     (select coalesce(sum(refines), 0) from public.rewrites where created_at > now() - interval '30 days'),
    'trials_7d',      (select count(*) from public.trial_uses where created_at > now() - interval '7 days'),
    'daily',          (select jsonb_agg(jsonb_build_object('day', to_char(g.d, 'YYYY-MM-DD'), 'n', coalesce(r.n, 0)) order by g.d)
                         from today,
                              generate_series(today.d - interval '13 days', today.d, interval '1 day') as g(d)
                         left join (
                           select date_trunc('day', created_at at time zone 'Europe/London') as d, count(*) n
                             from public.rewrites
                            where created_at > now() - interval '15 days'
                            group by 1) r on r.d = g.d),
    'tones',          (select coalesce(jsonb_agg(t order by t.n desc), '[]'::jsonb) from (
                         select tone, count(*) n,
                                count(*) filter (where rating = 1) as up,
                                count(*) filter (where rating = -1) as down
                           from public.rewrites
                          where created_at > now() - interval '30 days'
                          group by tone) t),
    'reasons',        (select coalesce(jsonb_object_agg(rating_reason, n), '{}'::jsonb) from (
                         select rating_reason, count(*) n from public.rewrites
                          where rating = -1 and rating_reason is not null
                            and created_at > now() - interval '30 days'
                          group by rating_reason) t)
  );
$$;

revoke all on function public.admin_stats() from public, anon, authenticated;
grant execute on function public.admin_stats() to service_role;
