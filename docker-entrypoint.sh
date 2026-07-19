#!/bin/sh
# Aplica as migrations do banco próprio antes de subir o servidor, para que um
# `docker compose up -d --build` deixe tudo pronto sem passo manual.
set -e

echo "[entrypoint] aplicando migrations…"
node scripts/migrate.mjs

echo "[entrypoint] subindo o Next…"
exec "$@"
