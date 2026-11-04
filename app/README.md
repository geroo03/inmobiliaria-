# Showroom virtual (MVP)

App para recorrer un emprendimiento como en los showrooms tipo Urbania3D: vista aérea del edificio → piso → unidad, con disponibilidad, precios y consultas. Sigue el plan «Showroom virtual inmobiliario (tipo Urbania3D)».

No es 3D en tiempo real: son **imágenes fijas** por escena (día y noche), **videos cortos** de transición entre escenas y **polígonos clickeables** encima, alineados con la imagen.

## Qué hay

| Ruta | Qué hace |
|---|---|
| `/p/[slug]` | Portada con la vista principal y «Ingresar». |
| `/p/[slug]/explore/[sceneId]` | Visor: vistas del edificio con flechas ◀ ▶ (video de transición si hay; si no, fundido), Día/Noche (`?noche=1`), pisos clickeables con disponibilidad al pasar el mouse. |
| `/p/[slug]/buildings/[id]` | Lleva al piso con más unidades disponibles. |
| `/p/[slug]/buildings/[id]/floors/[floorId]` | Planta del piso (render cenital o plano), unidades pintadas por estado, selector de pisos y ficha. Link profundo: `?unit=u-7b&vista=2d`. |
| `/p/[slug]/units` | Buscador con filtros por estado, dormitorios, piso y precio. |
| `POST /api/leads` | Consulta: validación con Zod, campo trampa, límite por IP; devuelve el link de WhatsApp si el proyecto tiene número. |

Con `ROOT_DOMAIN` configurado, `{slug}.ROOT_DOMAIN` sirve el proyecto sin el prefijo `/p/{slug}` (`src/proxy.ts`).

## Correrlo

```bash
cd app
cp .env.example .env.local
npm install
npm run dev
```

Abrir http://localhost:3000 (lleva a `/p/torre-algarrobo`).

Comprobaciones:

```bash
npm test          # vitest: reducer del visor, transiciones, geometría, filtros, leads, subdominio
npm run typecheck
npm run lint
npm run build
```

## Datos

Hoy la app usa **datos de prueba en memoria** (`src/data/seed/torre-algarrobo`): proyecto ficticio de planta baja y 8 pisos con 4 unidades por piso, con las mismas tipologías, precios y estados que el showroom estático del repositorio. Los leads quedan en memoria y se pierden al reiniciar.

La migración para Supabase está lista en `supabase/migrations/` (esquema del plan, RLS y la vista `public_units`, que oculta el precio cuando `show_price` es falso). `supabase/tests/` tiene una prueba de RLS para correr en una base descartable. Para conectar Supabase falta implementar `ShowroomRepository` (`src/lib/data/repository.ts`) contra esa base y elegirlo en `src/lib/data/index.ts`; los leads se insertan desde el servidor con la service role.

## Contenido (imágenes, videos, plantas)

**Vistas del edificio:** fotos ilustrativas generadas con IA (`public/media/torre-algarrobo/fotos`), a partir de renders base del modelo 3D. Los pisos clickeables se miden sobre cada foto en `scripts/content/photos.params.json` (bordes de la fachada, altura de cada losa y pared lateral visible) y se convierten en polígonos con:

```bash
node scripts/content/photo-hotspots.mjs > src/data/seed/torre-algarrobo/fotos.json
```

La foto de noche puede tener otro encuadre que la de día: cada una lleva sus propios polígonos. Para sumar una vista, se mide en `photos.params.json`, se regenera `fotos.json` y se agrega en `SCENE_DEFS` (`src/data/seed/torre-algarrobo/index.ts`).

**Renders base y planta:** `scripts/content/` genera, desde el modelo 3D del showroom estático (`../showroom/showroom.html`), las vistas base para la IA, sus transiciones en video y la planta tipo (render cenital y plano 2D con el mismo encuadre, con la máscara de cada unidad):

```bash
THREE_DIR=<carpeta de three@0.128.0> node scripts/content/scenes.mjs /tmp/escenas --size=3072x2048 [--only-stills]
THREE_DIR=<carpeta de three@0.128.0> node scripts/content/floors.mjs /tmp/planta --px-per-m=122
scripts/content/encode.sh /tmp/escenas /tmp/planta public/media/torre-algarrobo
```

Necesitan Playwright con Chromium y ffmpeg. `THREE_DIR` es una copia local del paquete `three@0.128.0` (`npm pack three@0.128.0`).

Con un proyecto real, todo esto se reemplaza por los renders y videos de la desarrolladora, siguiendo el «Pipeline de contenido» del plan. En producción los medios van a un bucket (Cloudflare R2) y se apuntan con `NEXT_PUBLIC_MEDIA_BASE_URL`.

## Pendiente

- Repositorio de Supabase y admin (cambiar estados y precios, subir imágenes, editor de polígonos).
- Límite de envíos compartido entre instancias (hoy es en memoria, alcanza para un solo servidor).
- Número de WhatsApp real del proyecto (sin número, la consulta se guarda y no se ofrece el botón).
- Galerías, ubicación, contacto, comparador y tour 360 (fases 1–3 del plan).
