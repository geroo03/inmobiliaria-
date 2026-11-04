#!/usr/bin/env bash
# Convierte lo que generan scenes.mjs y floors.mjs en los archivos que usa la app.
# Uso: scripts/content/encode.sh <carpeta de scenes.mjs> <carpeta de floors.mjs> <destino, p. ej. public/media/torre-algarrobo>
set -euo pipefail
SRC="$1"; FLOOR="$2"; DEST="$3"
mkdir -p "$DEST/scenes" "$DEST/transiciones" "$DEST/pisos"

for f in "$SRC"/*-dia.jpg "$SRC"/*-noche.jpg; do
  ffmpeg -loglevel error -y -i "$f" -c:v libwebp -quality 82 "$DEST/scenes/$(basename "${f%.jpg}").webp"
done

# Cada carpeta de cuadros es una transición de ida (a__b); la vuelta (b__a) es el mismo video invertido.
for dir in "$SRC"/frames/*/; do
  name=$(basename "$dir")            # frente__este-dia
  pair=${name%-*}; moment=${name##*-}
  a=${pair%__*}; b=${pair#*__}
  for size in 1080 720; do
    w=$([ "$size" = 1080 ] && echo 1920 || echo 1280); crf=$([ "$size" = 1080 ] && echo 23 || echo 26)
    common=(-an -c:v libx264 -preset veryfast -crf "$crf" -pix_fmt yuv420p -movflags +faststart)
    ffmpeg -loglevel error -y -framerate 30 -i "$dir/%04d.jpg" -vf "scale=$w:-2" "${common[@]}" "$DEST/transiciones/${a}__${b}-${moment}-${size}.mp4"
    ffmpeg -loglevel error -y -framerate 30 -i "$dir/%04d.jpg" -vf "reverse,scale=$w:-2" "${common[@]}" "$DEST/transiciones/${b}__${a}-${moment}-${size}.mp4"
  done
done

ffmpeg -loglevel error -y -i "$FLOOR/planta-3d.jpg" -c:v libwebp -quality 84 "$DEST/pisos/planta-3d.webp"
cp "$FLOOR/planta-2d.svg" "$DEST/pisos/planta-2d.svg"
echo "Listo: $DEST"
