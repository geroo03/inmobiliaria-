# Showroom Algarrobo (demo)

Demo de un showroom digital para mostrar a desarrolladoras y propietarios. Usa dos proyectos ficticios en Córdoba:

- **Torre Algarrobo:** fachada con un piso por fila, planta de cada piso y ficha de cada departamento.
- **Barrio Los Talas:** plano de 20 lotes con casas o lotes sin construir.

Cada unidad muestra su estado (disponible, reservada o vendida), su precio de lista, un carrusel de imágenes y un plano de arquitecto: muros con espesor, puertas con arco de apertura, ventanas, mobiliario y medidas por ambiente. El botón «Ver plano grande» lo abre en pantalla completa.

La primera vista del carrusel es la **casa en 3D**, armada con los mismos datos del plano: muros de 2,60 m con sus huecos de puertas y ventanas, mobiliario, jardín, galería y techo a cuatro aguas (se puede sacar con «Ver por dentro»). Usa Three.js 0.128 desde jsDelivr; si no carga, el carrusel sigue funcionando con las fotos. Las medidas son ficticias y coherentes con la superficie cubierta de cada modelo. Desde la ficha se puede pedir una visita, armar el mensaje de WhatsApp con un código de seguimiento o copiar un enlace directo (`#u-7a`, `#lote-3`).

El **modo desarrolladora** permite cambiar el estado y el precio de una unidad. Esos cambios se guardan solo en el navegador de quien los hace (`localStorage`). En una versión real, irían a una base de datos compartida.

## Vitrina a pantalla completa

Cada ficha tiene el botón «Ver vitrina a pantalla completa»: fondo oscuro, la imagen de cada ambiente a pantalla completa con su nombre, pestañas abajo (Fachada, Salón y cocina, Dormitorio principal, Baño, Maqueta) y un panel con la ficha (dormitorios, baños, m², precio, estado, características y «Agendar visita»). La pestaña «Maqueta» muestra el modelo 3D sin techo con etiquetas sobre cada ambiente que llevan a su imagen. Si falta la imagen de un ambiente, se ve «Render en preparación». Se cierra con Esc o «Cerrar», y las flechas del teclado cambian de pestaña. Si el modelo tiene una maqueta isométrica en `imagenes.json` (sección `maquetas`, con la imagen y los puntos `x`, `y` entre 0 y 1), la pestaña «Maqueta» muestra esa imagen con etiquetas clickeables y el modelo 3D pasa a la pestaña «Modelo 3D». Hoy la tiene la Casa Patio.

## Edificio en 3D

En la vista Edificio, «Ver el edificio en 3D» abre la torre completa a pantalla completa: cada departamento se pinta según su estado (o como vidrio, con «Ver disponibilidad»), al pasar el mouse sobre un piso se ve cuántas unidades quedan y al tocarlo se elige. El panel muestra el piso elegido con su planta y sus unidades; tocar una abre la vitrina de esa unidad, que tiene «‹ Edificio» para volver. Las flechas arriba y abajo del teclado cambian de piso.

El panel «Sol y clima» cambia el cielo, la luz y las sombras:

- **Hora** (5 a 21 h) y **estación** (verano, otoño, invierno, primavera): el sol se ubica con la latitud y la longitud de Córdoba, y el panel dice su altura y hacia dónde está.
- **Ahora:** usa la hora actual de Córdoba (UTC-3) y se actualiza cada 30 segundos.
- **Clima:** despejado, nublado o lluvia. Es una simulación: la página no puede consultar el clima real porque el Artifact no permite llamar a servicios externos.
- **De noche** se prenden el lobby y, en la vista de vidrio, parte de los departamentos.

La escena usa texturas dibujadas en la propia página (revoque, pasto, asfalto, veredas, muro cortina y ventanas del barrio), cielo físico con `Sky.js` de Three.js 0.128 (si no carga, se usa un degradé), reflejos del cielo en vidrios y autos, mapeo de tonos ACES, árboles, autos, y las sierras al oeste con relieve. Es un modelo en tiempo real: se ve realista, pero no es un render fotográfico. Para eso harían falta renders hechos con Lumion, Twinmotion o D5, o fotos tomadas con dron.

«Ver la vista desde el balcón» pone la cámara en el balcón de cada unidad, a la altura de su piso, para mirar alrededor arrastrando. El barrio y las sierras son ilustrativos.

En la vista desde el balcón, el botón **Foto | 3D** alterna entre una foto ilustrativa y el modelo 3D. La foto depende de la orientación del balcón (norte para las unidades A y B, sur para C y D) y del momento que marca la barra de la hora: de día, al atardecer (con el sol bajo hacia el oeste) o de noche. Con nublado o lluvia, el clima se simula sobre la foto con filtros y gotas animadas, y el rótulo lo aclara. Las rutas están en `imagenes.json`, sección `vistas`; si una queda vacía, se ve el 3D. Hoy falta la foto del sur de noche.

## Fotos

Las rutas de las fotos están en `imagenes.json`, una lista por modelo (`tipologia-a` a `tipologia-d`, `casa-patio`, `casa-compacta` y `lote`), más las maquetas (`maquetas`) y las vistas desde el balcón (`vistas`). Para cargar una foto:

1. Guardala en `img/`, por ejemplo `img/tipologia-a/living.jpg`.
2. Escribí esa ruta en `src` del ambiente que corresponda.
3. Publicá la foto y el JSON junto con la página.

Solo se aceptan rutas dentro de `img/` con extensión jpg, png, webp o avif. Si `src` está vacío o la foto no carga, se ve un marcador con el nombre del ambiente. Todas las imágenes llevan el rótulo «Imagen ilustrativa».

## Datos

Todos los datos son ficticios y salen de un generador con semilla fija en el propio archivo: siempre se ven igual.

## Formato

`showroom.html` es el contenido de un Artifact de claude.ai: no incluye `<!doctype>`, `<head>` ni `<body>`, porque los agrega la plataforma al publicar. Para abrirlo como archivo suelto, hay que envolverlo en un documento HTML completo.

## Pendiente antes de mostrarlo

- Completar el nombre de la inmobiliaria y la matrícula del corredor responsable en el pie (Ley 9445, art. 16 n).
