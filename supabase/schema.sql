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
