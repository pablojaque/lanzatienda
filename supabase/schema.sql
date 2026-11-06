-- Dropshype: tabla de tiendas. Pégalo en Supabase → SQL Editor → Run.

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  store_name text not null,
  project_name text not null unique,
  deployment_id text,
  url text,
  domain text unique,
  created_at timestamptz not null default now()
);

create index if not exists stores_user_id_idx on public.stores (user_id);

-- Cada usuario solo puede VER sus tiendas. Crear o cambiar tiendas solo lo hace
-- el servidor de Dropshype (con la secret key), nunca el navegador.
alter table public.stores enable row level security;

drop policy if exists "Cada usuario ve sus tiendas" on public.stores;
create policy "Cada usuario ve sus tiendas"
  on public.stores for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Si la tabla stores ya existía de antes, esto le añade la columna del dominio
alter table public.stores add column if not exists domain text unique;

-- Compras de dominios: el usuario paga en Stripe y Dropshype lo compra en Vercel.
-- Estados: pending_payment → paid → buying → bought → connected (o failed / canceled)
create table if not exists public.domain_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  domain text not null,
  price_cents integer not null,
  vercel_price_usd numeric(10, 2) not null,
  contact jsonb not null,
  status text not null default 'pending_payment',
  stripe_session_id text unique,
  stripe_payment_intent text,
  vercel_order_id text,
  refunded boolean not null default false,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists domain_orders_user_id_idx on public.domain_orders (user_id);
-- Un mismo dominio no se puede estar comprando dos veces a la vez
create unique index if not exists domain_orders_active_domain_idx
  on public.domain_orders (domain) where status in ('paid', 'buying', 'bought');

alter table public.domain_orders enable row level security;

drop policy if exists "Cada usuario ve sus compras de dominio" on public.domain_orders;
create policy "Cada usuario ve sus compras de dominio"
  on public.domain_orders for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Analíticas: cada visita y clic de las tiendas publicadas (lo apunta el servidor de Dropshype)
create table if not exists public.store_events (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  type text not null check (type in ('view', 'checkout', 'pay')),
  visitor text,
  source text,
  device text,
  created_at timestamptz not null default now()
);

create index if not exists store_events_store_created_idx on public.store_events (store_id, created_at);

alter table public.store_events enable row level security;

drop policy if exists "Cada usuario ve las analíticas de sus tiendas" on public.store_events;
create policy "Cada usuario ve las analíticas de sus tiendas"
  on public.store_events for select
  to authenticated
  using (exists (select 1 from public.stores s where s.id = store_id and s.user_id = (select auth.uid())));

-- Resumen de los últimos p_days días de una tienda (solo devuelve datos si la tienda es tuya)
create or replace function public.store_stats(p_store uuid, p_days int default 30)
returns json
language sql
stable
security invoker
set search_path = public
as $$
  with ev as (
    select * from store_events
    where store_id = p_store and created_at >= (current_date - (p_days - 1))
  ),
  days as (
    select generate_series(current_date - (p_days - 1), current_date, interval '1 day')::date as day
  ),
  per_day as (
    select created_at::date as day,
      count(*) filter (where type = 'view') as views,
      count(distinct visitor) filter (where type = 'view') as visitors
    from ev group by 1
  )
  select json_build_object(
    'views', (select count(*) from ev where type = 'view'),
    'visitors', (select count(distinct visitor) from ev where type = 'view'),
    'checkouts', (select count(*) from ev where type = 'checkout'),
    'pays', (select count(*) from ev where type = 'pay'),
    'daily', (
      select json_agg(json_build_object('day', d.day, 'views', coalesce(p.views, 0), 'visitors', coalesce(p.visitors, 0)) order by d.day)
      from days d left join per_day p on p.day = d.day
    ),
    'sources', (
      select coalesce(json_agg(json_build_object('name', name, 'visits', n) order by n desc), '[]'::json)
      from (select coalesce(source, 'Directo') as name, count(*) as n from ev where type = 'view' group by 1 order by 2 desc limit 6) s
    ),
    'devices', (
      select coalesce(json_agg(json_build_object('name', name, 'visits', n) order by n desc), '[]'::json)
      from (select coalesce(device, 'Otro') as name, count(*) as n from ev where type = 'view' group by 1) d
    )
  );
$$;

-- Editar tiendas: todo lo que define cada tienda (productos, colores, upsells…)
alter table public.stores add column if not exists config jsonb;

-- Cobro con tarjeta en las tiendas: la cuenta de Stripe (Connect) de cada usuario
create table if not exists public.stripe_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  account_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.stripe_accounts enable row level security;

drop policy if exists "Cada usuario ve su cuenta de cobros" on public.stripe_accounts;
create policy "Cada usuario ve su cuenta de cobros"
  on public.stripe_accounts for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Asistente de IA del editor: cuántos mensajes manda cada usuario al día (para limitar el gasto)
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- Suma un mensaje y dice si aún entra en el límite del día. Solo la usa el servidor (secret key).
create or replace function public.ai_take(p_user uuid, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  insert into public.ai_usage (user_id, day, count)
  values (p_user, current_date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
  returning count into n;
  return n <= p_limit;
end;
$$;

revoke all on function public.ai_take(uuid, integer) from public, anon, authenticated;
grant execute on function public.ai_take(uuid, integer) to service_role;
