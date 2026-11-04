-- Prueba de RLS: correr después de 00_auth_stub.sql y de la migración, en una base descartable.
-- Lo esperado está en supabase/tests/README.md.
\set ON_ERROR_STOP 0
-- Supabase da estos permisos a anon/authenticated sobre public; RLS decide qué filas se ven.
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
insert into auth.users values ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222');
insert into organizations (id, name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Org 1'), ('aaaaaaaa-0000-0000-0000-000000000002', 'Org 2');
insert into organization_members values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'editor'),
                                        ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'sales');
insert into projects (id, organization_id, slug, name, is_published) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'publicado', 'Publicado', true),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'borrador', 'Borrador', false);
insert into buildings (id, project_id, name) values ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Torre'),
                                                    ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'Torre B');
insert into floors (id, building_id, name, level, image_3d_url, width, height) values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', '1°', 1, 'x.webp', 10, 10),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002', '1°', 1, 'x.webp', 10, 10);
insert into units (floor_id, code, price, show_price) values
  ('dddddddd-0000-0000-0000-000000000001', '1A', 100, true),
  ('dddddddd-0000-0000-0000-000000000001', '1B', 200, false),
  ('dddddddd-0000-0000-0000-000000000002', '1A', 300, true);
insert into leads (project_id, name, phone) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Ana', '3510000000');

\echo '--- anon'
set role anon;
select 'projects visibles' as t, count(*) from projects;
select 'units (tabla)' as t, count(*) from units;
select 'public_units' as t, code, price from public_units order by code;
select 'leads' as t, count(*) from leads;
insert into leads (project_id, name, phone) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Spam', '3510000000');
update projects set name = 'hack';
select 'nombre tras update anon' as t, name from projects;
reset role;

\echo '--- usuario de otra organización (sales org 2)'
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'projects visibles' as t, count(*) from projects;
select 'units (tabla)' as t, count(*) from units;
select 'leads' as t, count(*) from leads;
update units set status = 'sold';
reset role; select 'units vendidas tras update ajeno' as t, count(*) from units where status = 'sold';

\echo '--- editor de la organización dueña'
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'projects visibles' as t, count(*) from projects;
select 'units con precio real' as t, code, price from units order by code, price;
select 'leads' as t, count(*) from leads;
update units set status = 'reserved' where code = '1A';
reset role; select 'units reservadas tras update propio' as t, count(*) from units where status = 'reserved';
