# Boardify UI Guidelines

Este documento define el estilo visual y de interacción de Boardify.  
Si hay dudas de diseño, este archivo es la referencia principal.

## 1. Principios de UI

- Priorizar claridad por sobre ornamentación.
- Mantener consistencia entre `games`, `users`, `friends`, `groups` y `notifications`.
- Representar estado con color + ícono + texto (no solo color).
- Evitar layouts genéricos: tarjetas con intención visual, jerarquía clara y acciones obvias.
- Desktop y mobile deben verse como el mismo producto, no dos diseños distintos.

## 2. Lenguaje visual

### 2.1 Tarjetas

- Base por defecto:
  - `rounded-xl` o `rounded-2xl`
  - `border`
  - `bg-card/70`
  - `shadow-sm`
- Variantes por estado:
  - Membresía/estado positivo: borde/fondo verde suave.
  - Estado neutro: borde base + `bg-muted/20` o `bg-background/65`.

### 2.2 Chips / badges (burbujitas)

- Usar chips con borde, color semántico e ícono cuando el estado lo amerita.
- Estilo recomendado:
  - `inline-flex items-center gap-1.5 rounded-full border ... px-3 py-1`
- Los estados clave (joined, invitation pending, members count, created date) deben verse como chips.

### 2.3 Semántica de color

- Verde (`emerald`): éxito, aceptación, membresía (`Joined`, `Accept`, `Friends`).
- Celeste (`sky`): estado informativo / enviado por mí (`Request sent`, conteos).
- Ámbar (`amber`): estado pendiente recibido (`Invitation pending`, `Invitation only`).
- Rojo (`destructive`): acciones destructivas/rechazo (`Reject`, `Delete`, `Clear all`).
- Violeta (`violet`): privacidad (`Private`).
- Gris (`muted`): información secundaria/no prioritaria.

## 3. Iconografía (Lucide)

### 3.1 Estados sociales (users/friends/groups)

- `UserCheck`: relación aceptada / miembro.
- `CircleHelp`: solicitud o invitación pendiente recibida.
- `Clock3`: solicitud pendiente enviada por el usuario actual.
- `UserPlus`: acción de enviar solicitud.

### 3.2 Grupos

- `Globe`: `PUBLIC`.
- `Mail`: `INVITATION`.
- `Lock`: `PRIVATE`.
- `Users`: cantidad de miembros.
- `Check`: confirmar/aceptar.
- `X`: cancelar/rechazar.

### 3.3 Reglas

- En controles solo-ícono, envolver con `Tooltip`.
- Siempre acompañar color con ícono y/o etiqueta textual.
- No cambiar semántica de íconos entre páginas.

## 4. Layout responsive

### 4.1 Desktop / laptop

- Aprovechar ancho horizontal para mostrar:
  - metadatos a la izquierda,
  - estado + acciones a la derecha.
- En secciones de requests del perfil (`/u/[username]/groups`), los bloques deben ocupar todo el ancho cuando se pide foco en una sola columna.
- En listados, mantener grillas (`sm`/`lg`) cuando aportan scan visual; evitar dividir sub-secciones críticas si reduce legibilidad.

### 4.2 Mobile

- Prioridad vertical clara:
  1. identidad (avatar/título),
  2. estado,
  3. acciones.
- En mobile, acciones tipo `Accept/Reject/Cancel` centradas horizontalmente cuando aparecen debajo del contenido.
- Evitar overflow horizontal de chips y acciones; permitir wrap con separación consistente.
- CTA flotantes (ej. `Create group`) deben respetar `safe-area` y no tapar footer.

## 5. Botones y acciones

- Primarias positivas: borde/fondo verde suave.
- Acciones positivas sensibles (ej. `Promote to admin`) pueden usar `AlertDialog` con boton verde (no rojo).
- Destructivas (`Reject`, `Delete`, `Clear all`):
  - usar rojo en reposo y hover,
  - no permitir que `hover` convierta texto a blanco por herencia de `outline`.
- Botones de acción de listas:
  - desktop: normalmente alineados a la derecha del item,
  - mobile: centrados cuando quedan en renglón propio.

## 6. Popups, confirmaciones y menús

### 6.1 AlertDialog (confirmación)

Usar para acciones destructivas o sensibles:
- sign out,
- clear all notifications,
- unfriend,
- leave group,
- delete group,
- promote member to admin,
- kick member from group.

Patrón:
- título claro en pregunta,
- descripción corta del impacto,
- botón `Cancel`,
- botón final con semántica de riesgo (`destructive` cuando aplica).

### 6.2 DropdownMenu

Usar para acciones secundarias/contextuales (menú de perfil o grupo), no para confirmar riesgo.
En listas de miembros, el menu de `...` es el lugar para acciones de moderacion (`Promote to admin`, `Kick from group`).
En el menu de perfil del owner, priorizar acciones separadas: `Edit profile` (perfil publico) y `Configure profile` (settings).

### 6.3 Popup de contenido (Add members)

- Usar modal/popup cuando la lista es larga o requiere foco.
- En desktop, ancho razonable (`sm:max-w-*`).
- En mobile, scroll interno y header/footer fijos del popup cuando convenga.

## 7. Notificaciones UI

- Orden: más reciente arriba.
- No se eliminan al verse (solo cuando se borra manualmente o clear all).
- Botón de borrado individual (`X`) visible y alineado.
- `Clear all notifications` aparece al final de la página de notificaciones y con confirmación.
- Campana:
  - badge con unread count,
  - color accesible en light/dark,
  - actualización al navegar para evitar refresh manual.

## 8. Microcopy

- Copy corto, directo y accionable.
- Mantener consistencia verbal:
  - `Request sent`, `Accept`, `Reject`, `Cancel`, `Join group`, `Invitation pending`, `Promote to admin`, `Kick from group`, `Kicked from group`.
- Evitar frases largas en botones.
- En estados vacíos: incluir CTA útil (ej. find users, browse groups, browse games).

## 9. Checklist de PR UI

Antes de mergear cambios visuales:

- Se ve bien en mobile y laptop.
- No hay overflow horizontal ni botones cortados.
- Estados usan ícono + color + texto consistente.
- Hover/focus/active no rompen semántica (especialmente botones rojos).
- Los popups de confirmación existen donde hay riesgo.
- CTA flotantes no tapan footer ni contenido crítico.
- Se reutilizan patrones existentes antes de inventar uno nuevo.

## 10. Referencias de implementación actuales

- `src/app/(protected)/users/page.tsx` (estados con íconos de relación).
- `src/app/(protected)/groups/page.tsx` (estados de relación a grupos).
- `src/app/(protected)/groups/[slug]/page.tsx` (header responsive y flujos de join/invite).
- `src/app/(protected)/u/[username]/groups/page.tsx` (sent/received requests).
- `src/app/(protected)/notifications/page.tsx` y `src/app/(protected)/notifications/clear-all-notifications-button.tsx`.
- `src/components/groups/group-actions-menu.tsx`.
- `src/components/groups/member-actions-menu.tsx`.
- `src/components/groups/add-members-popup.tsx`.
- `src/components/layout/footer.tsx`.
