# Boardify - Resumen de Proyecto

## Guia de UI
- Referencia principal de decisiones visuales y UX: `docs/UI_GUIDELINES.md`.
- Para cambios de componentes, responsive, iconografia, popups y microcopy, seguir esa guia.

## Stack principal
- Framework: Next.js 16 (App Router) + React 19 + TypeScript estricto.
- UI: Tailwind CSS v4 + shadcn/ui (estilo `new-york`) + Radix primitives + `lucide-react`.
- Autenticacion: Auth.js / NextAuth v5 (beta) con Google Provider y `@auth/prisma-adapter`.
- Base de datos: PostgreSQL + Prisma ORM (con `@prisma/adapter-pg` y cliente generado en `src/generated/prisma`).
- Runtime y tooling: Node.js, `pnpm`, ESLint 9 con `eslint-config-next`.

## Scripts de desarrollo y testing
- `pnpm dev`: levanta entorno de desarrollo (`next dev`).
- `pnpm build`: genera cliente Prisma y compila (`prisma generate && next build`).
- `pnpm start`: ejecuta build de produccion.
- `pnpm lint`: corre ESLint.
- `pnpm db:migrate`: aplica migraciones en desarrollo (`npx prisma migrate dev`).
- `pnpm db:seed`: carga catalogo inicial de juegos (`npx tsx prisma/seed.ts`).
- `pnpm db:studio`: abre Prisma Studio (`npx prisma studio`).
- Testing: actualmente no hay script `test` ni framework de tests automatizados configurado en el repo.

## Arranque rapido (2 minutos)
Nota: la primera vez puede tardar mas por setup de OAuth y base de datos.

### Prerequisitos
- Node.js 20+
- `pnpm`
- PostgreSQL corriendo
- Credenciales OAuth de Google

### Variables de entorno (`.env`)
```env
DATABASE_URL=...
DIRECT_URL=...
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

Para OAuth local con Google:
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### Comandos
```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abrir: `http://localhost:3000`

### Smoke check
- Se puede iniciar sesion con Google.
- Onboarding se completa y redirige a rutas protegidas.
- Cargan juegos/grupos sin errores de base de datos.

### Troubleshooting rapido
- `Missing AUTH_SECRET environment variable`: falta `AUTH_SECRET` en `.env`.
- Error de callback OAuth: revisar que la redirect URI coincida exactamente.
- Error Prisma/DB: verificar `DATABASE_URL` y que PostgreSQL este levantado.

## Convenciones de estilo
- TypeScript con `strict: true` y alias `@/* -> src/*`.
- ESLint basado en Next (`core-web-vitals` + reglas TypeScript).
- App Router con Server Components por defecto; se usa `"use server"` para server actions y `"use client"` cuando aplica.
- Estilos con utilidades Tailwind y variantes con `class-variance-authority` (`cva`).
- Componentes base de UI en `src/components/ui` (patron shadcn) y componentes de dominio en carpetas separadas.
- Uso de imports absolutos (`@/lib/...`, `@/components/...`).
- Validaciones de entrada en server actions antes de tocar DB.
- Revalidacion de rutas con `revalidatePath` tras mutaciones.

## Estructura de carpetas
```text
.
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── games/
├── src/
│   ├── app/
│   │   ├── (protected)/                     # rutas autenticadas (games, users, friends, groups, notifications)
│   │   ├── about/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   └── notifications/unread-count/
│   │   ├── contact/
│   │   ├── onboarding/
│   │   ├── signin/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── games/
│   │   ├── groups/
│   │   ├── layout/                          # navbar, footer, menu usuario, bell de notificaciones
│   │   ├── profile/
│   │   ├── theme/
│   │   └── ui/
│   ├── generated/prisma/                    # cliente Prisma generado
│   ├── lib/                                 # auth, acciones server, prisma client, notifications, utils
│   ├── types/
│   └── proxy.ts
├── components.json
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Notas arquitectonicas
- Auth: centralizada en `src/lib/auth.ts` con NextAuth + Google + Prisma Adapter.
- Sesion: estrategia JWT, extendida con `user.id`, `username` y estado de onboarding.
- Layout global: `src/app/layout.tsx` compone `Navbar` + `<main />` + `Footer`; el footer expone links a `/about` y `/contact`.
- Acceso: `src/app/(protected)/layout.tsx` obliga onboarding completo; paginas de dominio aplican checks server-side y usan `redirect()` / `notFound()` segun permisos.
- Mutaciones: `src/lib/actions.ts` concentra server actions para auth, onboarding, perfil, amistades, grupos, invitaciones/solicitudes y estado de juegos.
- Mutaciones de grupos incluyen moderacion de miembros por admins (`promote to admin`, `kick member`), con checks de permiso server-side.
- Notificaciones: `src/lib/notifications.ts` centraliza creacion/listado/contador no leidas, marcado como vistas por scope o por grupo, y borrado logico (`deletedAt`). Incluye eventos de membresia/rol en grupos (join, promoted to admin, kicked). El badge de la campana consume `/api/notifications/unread-count`.
- Integridad: validacion defensiva de inputs (regex/enums), checks de autorizacion y `revalidatePath` despues de cambios.
- Dominio de datos (Prisma):
  - Auth: `User`, `Account`, `Session`, `VerificationToken`.
  - Catalogo: `Game`, `Category`, `GameCategory`, `UserGame`.
  - Social: `Friendship`, `Notification`, `NotificationEventKey`.
  - Grupos: `Group`, `GroupMember`, `GroupInvitation`, `GroupJoinRequest`, `GroupSlug`.
- Seguridad web: `next.config.ts` agrega headers de seguridad globales, CSP/HSTS en produccion y allowlist explicita para imagenes remotas.
- Persistencia: Prisma corre sobre `pg.Pool` + `PrismaPg` (`src/lib/prisma.ts`) y la semilla `prisma/seed.ts` usa `upsert` para juegos y categorias.
