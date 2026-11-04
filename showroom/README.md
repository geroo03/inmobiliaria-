# Showroom Algarrobo (demo)

Demo de un showroom digital para mostrar a desarrolladoras y propietarios. Usa dos proyectos ficticios en Córdoba:

- **Torre Algarrobo:** fachada con un piso por fila, planta de cada piso y ficha de cada departamento.
- **Barrio Los Talas:** plano de 20 lotes con casas o lotes sin construir.

Cada unidad muestra su estado (disponible, reservada o vendida), su precio de lista, un carrusel de imágenes y un plano de arquitecto: muros con espesor, puertas con arco de apertura, ventanas, mobiliario y medidas por ambiente. El botón «Ver plano grande» lo abre en pantalla completa.

La primera vista del carrusel es la **casa en 3D**, armada con los mismos datos del plano: muros de 2,60 m con sus huecos de puertas y ventanas, mobiliario, jardín, galería y techo a cuatro aguas (se puede sacar con «Ver por dentro»). Usa Three.js 0.128 desde jsDelivr; si no carga, el carrusel sigue funcionando con las fotos. Las medidas son ficticias y coherentes con la superficie cubierta de cada modelo. Desde la ficha se puede pedir una visita, armar el mensaje de WhatsApp con un código de seguimiento o copiar un enlace directo (`#u-7a`, `#lote-3`).

El **modo desarrolladora** permite cambiar el estado y el precio de una unidad. Esos cambios se guardan solo en el navegador de quien los hace (`localStorage`). En una versión real, irían a una base de datos compartida.

## Vitrina a pantalla completa

Cada ficha tiene el botón «Ver vitrina a pantalla completa»: fondo oscuro, la imagen de cada ambiente a pantalla completa con su nombre, pestañas abajo (Fachada, Salón y cocina, Dormitorio principal, Baño, Maqueta) y un panel con la ficha (dormitorios, baños, m², precio, estado, características y «Agendar visita»). La pestaña «Maqueta» muestra el modelo 3D sin techo con etiquetas sobre cada ambiente que llevan a su imagen. Si falta la imagen de un ambiente, se ve «Render en preparación». Se cierra con Esc o «Cerrar», y las flechas del teclado cambian de pestaña.

## Fotos

Las rutas de las fotos están en `imagenes.json`, una lista por modelo (`tipologia-a` a `tipologia-d`, `casa-patio`, `casa-compacta` y `lote`). Para cargar una foto:

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
