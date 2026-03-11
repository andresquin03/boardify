#!/bin/bash
# Bloquea ediciones accidentales de archivos sensibles o migraciones existentes.
# Claude Code lo invoca antes de cada Edit/Write.

FILE=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.file_path // empty' 2>/dev/null)

if [[ -z "$FILE" ]]; then
  exit 0
fi

# Bloquear edición de .env (cualquier variante)
if [[ "$FILE" == *".env"* ]]; then
  echo "ERROR: Edición bloqueada — '$FILE' es un archivo de entorno sensible. Editalo manualmente si es necesario." >&2
  exit 1
fi

# Bloquear edición de migraciones Prisma existentes (solo las ya commiteadas)
if [[ "$FILE" == *"prisma/migrations/"* ]] && [[ "$FILE" != *"migration_lock.toml" ]]; then
  echo "ERROR: Edición bloqueada — las migraciones Prisma no deben modificarse una vez creadas. Creá una nueva migración con 'pnpm db:migrate'." >&2
  exit 1
fi

exit 0
