# Prueba de la migración y de RLS

En una base Postgres **descartable** (nunca en la de producción):

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/00_auth_stub.sql -f supabase/migrations/20261104000000_init.sql
psql "$DATABASE_URL" -f supabase/tests/10_rls_check.sql
```

Resultado esperado de `10_rls_check.sql`:

| Rol | Proyectos visibles | Tabla `units` | `public_units` | Leads | Escritura |
|---|---|---|---|---|---|
| anon | 1 (solo el publicado) | 0 filas | 1A con precio, 1B sin precio, nada del borrador | 0 | insert en leads rechazado; update sin efecto |
| otra organización | 1 | 0 filas | — | 0 | update sin efecto |
| editor de la organización | 2 | 3 filas con precio real | — | 1 | puede actualizar sus unidades |
