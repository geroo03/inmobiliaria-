#!/usr/bin/env bash
# Cuadros para girar el edificio arrastrando: extrae N cuadros parejos de un video de giro,
# en 1280 px (computadora) y 720 px (celular), en WebP.
# Uso: scripts/content/orbit-frames.sh <video.mp4> <destino, p. ej. public/media/torre-algarrobo/orbita/frente__esquina> [N=96]
set -euo pipefail
VIDEO="$1"; DEST="$2"; N="${3:-96}"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
FPS=$(python3 -c "print(($N - 1) / $DUR)")
for W in 1280 720; do
  mkdir -p "$DEST/$W"
  rm -f "$DEST/$W"/*.webp
  ffmpeg -loglevel error -y -i "$VIDEO" -vf "fps=$FPS,scale=$W:-2" -frames:v "$N" -c:v libwebp -quality 62 "$DEST/$W/%03d.webp"
done
# ffmpeg numera desde 001: se pasa a base 0.
for W in 1280 720; do
  (cd "$DEST/$W" && for f in $(ls | sort); do n=$((10#${f%.webp} - 1)); mv "$f" "$(printf '%03d' $n).webp.tmp"; done && for f in *.tmp; do mv "$f" "${f%.tmp}"; done)
done
echo "$(ls "$DEST/1280" | wc -l) cuadros en $DEST"
