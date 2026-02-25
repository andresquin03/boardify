# Boardify

Boardify es una app para organizar juntadas de juegos de mesa con amigos. En vez de resolver todo por chat, centraliza biblioteca de juegos, amistades, grupos e invitaciones para decidir mas rapido que jugar.

## Que problema resuelve

Coordinar una noche de juegos suele tener friccion:
- no esta claro que juegos comparten las personas,
- cuesta ver quien puede unirse a cada plan,
- invitaciones y solicitudes se pierden entre mensajes.

Boardify baja esa friccion con flujos simples de perfil, amigos, grupos y notificaciones.

## Funcionalidades principales

- Biblioteca personal de juegos (favoritos, wishlist y owned).
- Detalle de juego con lista de amigos que lo tienen (si sos usuario autenticado).
- Descubrimiento de usuarios con perfiles publicos y comparacion de compatibilidad.
- Edicion de perfil publico en `/profile/edit` y configuracion unificada en `/settings` (idioma, visibilidad y preferencias de notificaciones).
- Internacionalizacion con `next-intl` (idiomas `en` y `es`) y persistencia de preferencia de idioma por usuario.
- Sistema de amistad con solicitud, aceptacion, cancelacion y unfriend.
- Grupos con visibilidad `PUBLIC`, `INVITATION` y `PRIVATE`.
- Invitaciones a grupos entre amigos y solicitudes de ingreso para grupos por invitacion.
- Moderacion de miembros en grupos: admins pueden promover miembros a admin y expulsar (`kick`) miembros no-admin.
- Eventos de grupo: crear, editar y eliminar eventos con fecha/hora, timezone, anfitrion/lugar, juegos a llevar (con portador opcional) y notas. Permisos: creador del evento o admin del grupo.
- Integracion con Google Calendar: crear, actualizar y cancelar eventos con notificacion a invitados (re-autorizacion on-demand). La descripcion incluye lista de juegos y link al evento en Boardify.
- `/groups` muestra los grupos privados a los que el usuario pertenece ademas de los publicos e "invitation only".
- Centro de notificaciones (no leidas, vistas, borrado individual y clear all). Cubre amistades, grupos y eventos — incluye notificaciones de edicion y eliminacion.

## Estado actual

Proyecto en desarrollo activo. El MVP social esta funcional y ya incluye autenticacion, onboarding, amigos, grupos y notificaciones.

## Stack tecnico

- Next.js 16 (App Router) + React 19 + TypeScript (`strict`).
- Tailwind CSS v4 + shadcn/ui + Radix + `lucide-react`.
- Internacionalizacion: `next-intl` + catalogos `messages/*.json`.
- Auth.js / NextAuth v5 (Google OAuth) + Prisma Adapter.
- PostgreSQL + Prisma ORM.
- `pnpm` + ESLint 9 (`eslint-config-next`).

## Requisitos

- Node.js 20+
- `pnpm`
- PostgreSQL corriendo
- Credenciales OAuth de Google

## Configuracion local rapida

1. Instalar dependencias:
```bash
pnpm install
```

2. Crear/actualizar `.env`:
```env
DATABASE_URL=...
DIRECT_URL=...
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

3. Configurar Google OAuth para desarrollo local:
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

4. Ejecutar DB + app:
```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

5. Abrir:
- `http://localhost:3000`

## Scripts utiles

- `pnpm dev`: levantar entorno local.
- `pnpm build`: generar cliente Prisma + build de Next.
- `pnpm start`: ejecutar build de produccion.
- `pnpm lint`: correr ESLint.
- `pnpm db:migrate`: aplicar migraciones en desarrollo.
- `pnpm db:seed`: seed inicial del catalogo.
- `pnpm db:studio`: abrir Prisma Studio.

## Arquitectura (resumen)

- `src/app`: rutas App Router (publicas y protegidas).
- `src/app/(protected)`: dominio principal autenticado (games, users, friends, groups, profile, settings, notifications) e incluye eventos de grupos (`/groups/[slug]/events`, `/new`, `/[eventId]`, `/[eventId]/edit`).
- `src/lib/actions.ts`: server actions con mutaciones de dominio (incluyendo creacion, edicion y eliminacion de eventos de grupos, con notificaciones).
- `src/lib/notifications.ts`: logica de notificaciones (crear, listar, marcar vistas, borrar) basada en catalogo de eventos y scopes. Cubre amistades, grupos, membresia y eventos de grupo (create/update/delete).
- `src/lib/google-calendar.ts`: integracion con Google Calendar (refresh token, crear, actualizar y cancelar eventos con `sendUpdates=all`).
- `src/app/api/auth/calendar-connect/route.ts`: re-auth con Google para pedir scope `calendar.events` cuando el usuario quiere exportar un evento.
- `src/i18n/request.ts`: resolucion de locale por request con prioridad `user.language` -> cookie `boardify_lang` -> `Accept-Language` -> `en`.
- `src/lib/locale.ts`: normalizacion de locales (`en`, `es`) y mapeo entre locale UI y `User.language` (`EN`/`ES`).
- `src/proxy.ts`: inicializa cookie de idioma para visitantes no autenticados segun `Accept-Language`.
- `messages/en.json` y `messages/es.json`: fuente de verdad para textos UI por namespace.
- Convencion de copy: en `es` se usa registro rioplatense (Uruguay/Argentina).
- `TODO (future review)`: `Notification.payload` guarda snapshot de `groupName/groupSlug`; puede quedar desactualizado tras rename y el link puede fallar si el grupo se elimina.
- Notificaciones de amistad: `/friends` marca vistas las del scope amistad; visitar `/u/[username]` marca vistas solo las notificaciones de amistad cuyo actor es ese usuario.
- Notificaciones de grupos: `/u/[username]/groups` (solo owner) marca vistas las del scope grupos; visitar `/groups/[slug]` marca vistas solo las notificaciones del grupo abierto (por `entityId` o `payload.groupId`).
- `prisma/schema.prisma`: modelos de auth, juegos, amistad, grupos, eventos de grupos (`GroupEvent`, `GroupEventGame`), settings de usuario y notificaciones.

## Verificacion rapida (smoke check)

- Login con Google funciona.
- Onboarding completa correctamente.
- Se pueden enviar/aceptar solicitudes de amistad.
- Se pueden crear grupos, invitar amigos y gestionar solicitudes.
- La campana refleja notificaciones no leidas.

## Troubleshooting

- `Missing AUTH_SECRET environment variable`: falta `AUTH_SECRET` en `.env`.
- Error de callback OAuth: revisar URI exacta en Google Console.
- Error de DB/Prisma: validar `DATABASE_URL` y que PostgreSQL este activo.

## Documentacion adicional

- Guía de diseño UI/UX: `docs/UI_GUIDELINES.md`.
- Resumen tecnico extendido: `CLAUDE.md`.
