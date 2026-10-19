-- LanzaTienda: tabla de tiendas. Pégalo en Supabase → SQL Editor → Run.

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
-- el servidor de LanzaTienda (con la secret key), nunca el navegador.
alter table public.stores enable row level security;

drop policy if exists "Cada usuario ve sus tiendas" on public.stores;
create policy "Cada usuario ve sus tiendas"
  on public.stores for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Si la tabla stores ya existía de antes, esto le añade la columna del dominio
alter table public.stores add column if not exists domain text unique;

-- Compras de dominios: el usuario paga en Stripe y LanzaTienda lo compra en Vercel.
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
