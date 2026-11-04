# Showroom Algarrobo (demo)

Demo de un showroom digital para mostrar a desarrolladoras y propietarios. Usa dos proyectos ficticios en Córdoba:

- **Torre Algarrobo:** fachada con un piso por fila, planta de cada piso y ficha de cada departamento.
- **Barrio Los Talas:** plano de 20 lotes con casas o lotes sin construir.

Cada unidad muestra su estado (disponible, reservada o vendida), su precio de lista y un plano ilustrativo. Desde la ficha se puede pedir una visita, armar el mensaje de WhatsApp con un código de seguimiento o copiar un enlace directo (`#u-7a`, `#lote-3`).

El **modo desarrolladora** permite cambiar el estado y el precio de una unidad. Esos cambios se guardan solo en el navegador de quien los hace (`localStorage`). En una versión real, irían a una base de datos compartida.

## Datos

Todos los datos son ficticios y salen de un generador con semilla fija en el propio archivo: siempre se ven igual.

## Formato

`showroom.html` es el contenido de un Artifact de claude.ai: no incluye `<!doctype>`, `<head>` ni `<body>`, porque los agrega la plataforma al publicar. Para abrirlo como archivo suelto, hay que envolverlo en un documento HTML completo.

## Pendiente antes de mostrarlo

- Completar el nombre de la inmobiliaria y la matrícula del corredor responsable en el pie (Ley 9445, art. 16 n).
