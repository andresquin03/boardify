# Boardify - Resumen de Proyecto

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
- `pnpm db:migrate`: aplica migraciones en desarrollo (`prisma migrate dev`).
- `pnpm db:seed`: carga catalogo inicial de juegos (`tsx prisma/seed.ts`).
- `pnpm db:studio`: abre Prisma Studio.
- Testing: actualmente no hay script `test` ni framework de tests automatizados configurado en el repo.

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
│   │   ├── (protected)/          # rutas principales autenticadas
│   │   ├── api/auth/[...nextauth]/
│   │   ├── onboarding/
│   │   ├── signin/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── games/
│   │   ├── groups/
│   │   ├── layout/
│   │   ├── profile/
│   │   ├── theme/
│   │   └── ui/
│   ├── generated/prisma/         # cliente Prisma generado
│   ├── lib/                      # auth, acciones server, prisma client, utils
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
- Acceso: `src/app/(protected)/layout.tsx` obliga onboarding completo; paginas de dominio aplican checks server-side y usan `redirect()` / `notFound()` segun permisos.
- Mutaciones: `src/lib/actions.ts` concentra server actions para auth, onboarding, perfil, amistades, grupos y estado de juegos.
- Integridad: validacion defensiva de inputs (regex/enums), checks de autorizacion y `revalidatePath` despues de cambios.
- Dominio de datos (Prisma): auth (`User`, `Account`, `Session`, `VerificationToken`), catalogo (`Game`, `Category`, `GameCategory`, `UserGame`), social (`Friendship`) y grupos (`Group`, `GroupMember`, `GroupInvitation`, `GroupSlug`).
- Seguridad web: `next.config.ts` agrega headers de seguridad globales, CSP/HSTS en produccion y allowlist explicita para imagenes remotas.
- Persistencia: Prisma corre sobre `pg.Pool` + `PrismaPg` (`src/lib/prisma.ts`) y la semilla `prisma/seed.ts` usa `upsert` para juegos y categorias.
