---
name: commit
description: Commitear cambios del proyecto. Usar cuando el usuario pide hacer un commit, push, "commitear", o cualquier variante. Revisa docs antes de commitear.
---

# Workflow de commit para Boardify

## Paso 1 — Revisar qué cambió

Ejecutar en paralelo:
- `git status`
- `git diff HEAD`

## Paso 2 — Evaluar si los docs necesitan actualización

Revisar los cambios y decidir si corresponde actualizar docs:

| Tipo de cambio | Acción |
|----------------|--------|
| Nueva feature, módulo, o ruta | Actualizar `README.md` (Funcionalidades) + `CLAUDE.md` (Notas arquitectónicas) |
| Nuevo archivo clave en `src/lib/` o `src/components/` | Actualizar `MEMORY.md` (Key Files) |
| Cambio arquitectónico relevante | Actualizar `CLAUDE.md` |
| Bugfix menor, refactor interno, cambio de estilo | NO actualizar — ya están al día |
| Los propios docs ya fueron modificados en esta sesión | NO actualizar de nuevo |

Actualizar **solo las secciones relevantes**, de forma muy breve (1-2 líneas por cambio).

## Paso 3 — Commitear

- Stage los archivos relevantes (incluir docs si se actualizaron)
- Commit con mensaje corto en inglés, sin punto final, usando el formato del repo
- Incluir `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Si el usuario pidió push además del commit, pushear también
