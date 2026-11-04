-- Esquema inicial del showroom virtual (multi-proyecto).
-- Basado en el plan «Showroom virtual inmobiliario». Cambios respecto del plan:
--   * scene_hotspots acepta target_type 'floor' (un piso del edificio dentro de una escena exterior).
--   * scene_transitions guarda también el video de noche (si falta, el visor corta directo).
-- Coordenadas de polígonos: normalizadas 0–1 respecto de la imagen, [[x, y], ...].

create extension if not exists pgcrypto;

-- ---------- Tenancy ----------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'sales')),
  primary key (organization_id, user_id)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  tagline text,
  developer_name text,
  address text,
  lat double precision,
  lng double precision,
  primary_color text not null default '#164056' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_url text,
  developer_logo_url text,
  og_image_url text,
  seo_description text,
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{8,15}$'), -- E.164 sin '+'
  intro_video_url text,
  entry_scene_id uuid,
  disclaimer text,
  features jsonb not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Escenas exteriores y transiciones ----------
create table scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  image_day_url text not null,
  image_night_url text,               -- mismo encuadre y mismos hotspots
  width int not null check (width > 0),
  height int not null check (height > 0),
  blur_data_url text,
  sort_order int not null default 0
);
create index scenes_project_idx on scenes (project_id, sort_order);

alter table projects add constraint projects_entry_scene_fk
  foreign key (entry_scene_id) references scenes(id) on delete set null;

create table scene_transitions (
  id uuid primary key default gen_random_uuid(),
  from_scene_id uuid not null references scenes(id) on delete cascade,
  to_scene_id uuid not null references scenes(id) on delete cascade,
  direction text not null check (direction in ('left', 'right')),
  video_day_url text not null,         -- 1080p
  video_day_mobile_url text,           -- 720p
  video_night_url text,
  video_night_mobile_url text,
  unique (from_scene_id, to_scene_id),
  check (from_scene_id <> to_scene_id)
);

create table buildings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  status text not null default 'selling' check (status in ('selling', 'sold_out', 'coming_soon', 'not_for_sale')),
  sort_order int not null default 0
);
create index buildings_project_idx on buildings (project_id);

create table floors (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  name text not null,                  -- "16°"
  level int not null,
  image_3d_url text not null,          -- render cenital
  image_2d_url text,                   -- plano técnico, mismo encuadre
  width int not null check (width > 0),
  height int not null check (height > 0),
  unique (building_id, level)
);

create table scene_hotspots (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references scenes(id) on delete cascade,
  label text not null,
  polygon jsonb not null check (jsonb_typeof(polygon) = 'array'),
  label_anchor jsonb not null check (jsonb_typeof(label_anchor) = 'array'),
  target_type text not null check (target_type in ('scene', 'building', 'floor', 'url')),
  target_scene_id uuid references scenes(id) on delete set null,
  target_building_id uuid references buildings(id) on delete set null,
  target_floor_id uuid references floors(id) on delete set null,
  target_url text check (target_url is null or target_url ~ '^https://')
);
create index scene_hotspots_scene_idx on scene_hotspots (scene_id);

create table typologies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  total_area numeric(8, 2),
  covered_area numeric(8, 2),
  uncovered_area numeric(8, 2),
  rooms smallint,
  bedrooms smallint,
  bathrooms smallint,
  plan_3d_url text,
  brochure_url text,
  tour_360_url text,
  images jsonb not null default '[]'
);

create type unit_status as enum ('available', 'reserved', 'sold', 'blocked', 'not_available');

create table units (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references floors(id) on delete cascade,
  typology_id uuid references typologies(id) on delete set null,
  code text not null,                  -- "7A"
  status unit_status not null default 'available',
  price numeric(14, 2) check (price is null or price >= 0),
  currency text not null default 'USD',
  show_price boolean not null default false,
  orientation text,
  polygon jsonb,                       -- máscara sobre la planta (0–1)
  label_anchor jsonb,
  updated_at timestamptz not null default now(),
  unique (floor_id, code)
);
create index units_floor_idx on units (floor_id);
create index units_status_idx on units (status);

create table gallery_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  slug text not null,
  title text not null,
  icon text,
  sort_order int not null default 0,
  unique (project_id, slug)
);

create table gallery_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references gallery_sections(id) on delete cascade,
  media_url text not null,
  caption text,
  sort_order int not null default 0
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  unit_id uuid references units(id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  email text,
  phone text,
  message text check (message is null or char_length(message) <= 600),
  source text not null default 'web' check (source in ('web', 'kiosk', 'whatsapp')),
  utm jsonb,
  created_at timestamptz not null default now()
);
create index leads_project_idx on leads (project_id, created_at desc);

create table events (
  id bigint generated always as identity primary key,
  project_id uuid not null references projects(id) on delete cascade,
  session_id uuid not null,
  type text not null,                  -- scene_view | unit_view | lead_click
  payload jsonb,
  created_at timestamptz not null default now()
);
create index events_project_idx on events (project_id, created_at);

-- updated_at automático
create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger projects_updated_at before update on projects for each row execute function set_updated_at();
create trigger units_updated_at before update on units for each row execute function set_updated_at();

-- ---------- Funciones de acceso ----------
-- security definer + search_path fijo: las políticas las usan sin recursión sobre organization_members.
create function is_org_member(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members m where m.organization_id = org and m.user_id = auth.uid());
$$;

create function can_edit_org(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from organization_members m
                 where m.organization_id = org and m.user_id = auth.uid() and m.role in ('owner', 'editor'));
$$;

create function project_is_public(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from projects where id = p and is_published);
$$;

create function project_org(p uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from projects where id = p;
$$;

-- ---------- RLS ----------
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table projects enable row level security;
alter table scenes enable row level security;
alter table scene_transitions enable row level security;
alter table scene_hotspots enable row level security;
alter table buildings enable row level security;
alter table floors enable row level security;
alter table typologies enable row level security;
alter table units enable row level security;
alter table gallery_sections enable row level security;
alter table gallery_items enable row level security;
alter table leads enable row level security;
alter table events enable row level security;

create policy org_read on organizations for select using (is_org_member(id));
create policy members_read on organization_members for select using (is_org_member(organization_id));

-- Proyectos: público si está publicado; miembros ven todo lo suyo; editores escriben.
create policy projects_public_read on projects for select using (is_published or is_org_member(organization_id));
create policy projects_write on projects for all using (can_edit_org(organization_id)) with check (can_edit_org(organization_id));

-- Hijos directos del proyecto.
create policy scenes_read on scenes for select using (project_is_public(project_id) or is_org_member(project_org(project_id)));
create policy scenes_write on scenes for all using (can_edit_org(project_org(project_id))) with check (can_edit_org(project_org(project_id)));
create policy buildings_read on buildings for select using (project_is_public(project_id) or is_org_member(project_org(project_id)));
create policy buildings_write on buildings for all using (can_edit_org(project_org(project_id))) with check (can_edit_org(project_org(project_id)));
create policy typologies_read on typologies for select using (project_is_public(project_id) or is_org_member(project_org(project_id)));
create policy typologies_write on typologies for all using (can_edit_org(project_org(project_id))) with check (can_edit_org(project_org(project_id)));
create policy gallery_sections_read on gallery_sections for select using (project_is_public(project_id) or is_org_member(project_org(project_id)));
create policy gallery_sections_write on gallery_sections for all using (can_edit_org(project_org(project_id))) with check (can_edit_org(project_org(project_id)));

-- Nietos: se resuelve el proyecto por la tabla padre.
create function scene_project(s uuid) returns uuid language sql stable security definer set search_path = public as $$
  select project_id from scenes where id = s; $$;
create function building_project(b uuid) returns uuid language sql stable security definer set search_path = public as $$
  select project_id from buildings where id = b; $$;
create function floor_project(fid uuid) returns uuid language sql stable security definer set search_path = public as $$
  select b.project_id from floors f join buildings b on b.id = f.building_id where f.id = fid; $$;
create function section_project(s uuid) returns uuid language sql stable security definer set search_path = public as $$
  select project_id from gallery_sections where id = s; $$;

create policy transitions_read on scene_transitions for select
  using (project_is_public(scene_project(from_scene_id)) or is_org_member(project_org(scene_project(from_scene_id))));
create policy transitions_write on scene_transitions for all
  using (can_edit_org(project_org(scene_project(from_scene_id))))
  with check (can_edit_org(project_org(scene_project(from_scene_id))) and scene_project(from_scene_id) = scene_project(to_scene_id));
create policy hotspots_read on scene_hotspots for select
  using (project_is_public(scene_project(scene_id)) or is_org_member(project_org(scene_project(scene_id))));
create policy hotspots_write on scene_hotspots for all
  using (can_edit_org(project_org(scene_project(scene_id)))) with check (can_edit_org(project_org(scene_project(scene_id))));
create policy floors_read on floors for select
  using (project_is_public(building_project(building_id)) or is_org_member(project_org(building_project(building_id))));
create policy floors_write on floors for all
  using (can_edit_org(project_org(building_project(building_id)))) with check (can_edit_org(project_org(building_project(building_id))));
create policy gallery_items_read on gallery_items for select
  using (project_is_public(section_project(section_id)) or is_org_member(project_org(section_project(section_id))));
create policy gallery_items_write on gallery_items for all
  using (can_edit_org(project_org(section_project(section_id)))) with check (can_edit_org(project_org(section_project(section_id))));

-- Unidades: el público NO lee la tabla (tiene el precio de lista); lee la vista public_units.
-- Ventas puede cambiar estado y precio; editores todo.
create policy units_members_read on units for select using (is_org_member(project_org(floor_project(floor_id))));
create policy units_write on units for all
  using (is_org_member(project_org(floor_project(floor_id))))
  with check (is_org_member(project_org(floor_project(floor_id))));

-- Leads: datos personales. Solo los leen los miembros. Se insertan desde el servidor (service role),
-- después de validar y limitar por IP: no hay política de insert para anónimos.
create policy leads_members_read on leads for select using (is_org_member(project_org(project_id)));
create policy events_members_read on events for select using (is_org_member(project_org(project_id)));

-- ---------- Vista pública de unidades ----------
-- Corre con los permisos del dueño de la vista (no security_invoker): filtra por proyecto publicado
-- y oculta el precio cuando show_price = false. Así el precio oculto nunca llega al navegador.
create view public_units as
  select u.id, u.floor_id, u.typology_id, u.code, u.status,
         case when u.show_price then u.price end as price,
         u.currency, u.orientation, u.polygon, u.label_anchor, b.project_id
  from units u
  join floors f on f.id = u.floor_id
  join buildings b on b.id = f.building_id
  join projects p on p.id = b.project_id
  where p.is_published;

revoke all on public_units from anon, authenticated;
grant select on public_units to anon, authenticated;
