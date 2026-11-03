# boxplan-frontend

Web app de Boxplan2026 (React 19 + Vite + TypeScript + Tailwind 4, TanStack Query, React Hook Form + Zod). Ver `../RFC-001-arquitectura-inicial.md`.

## Correr

```bash
npm install
npm run dev        # http://localhost:5173 — /api se proxya al backend en :3000
```

Con el backend levantado (`npm run start:dev` en `boxplan-backend`).

## Tipos de la API

`src/api/schema.d.ts` se genera del OpenAPI del backend (no editar a mano):

```bash
npm run gen:api    # requiere el backend corriendo en :3000
```

El cliente (`src/api/client.ts`, `openapi-fetch`) agrega el Bearer y refresca el token ante un 401.

## Pantallas

- `/login` — login / registro.
- `/` — mis grupos con mi rol, crear grupo (quedo COACH), unirme con código (quedo ALUMNO).
- `/g/:id` como **coach** — semana (lunes a domingo), crear/editar/borrar workout con bloques, ver scores por bloque, generar código de invitación.
- `/g/:id` como **alumno** — "Hoy" (navegable por día), bloques, carga de score (tiempo `mm:ss`, reps, kg o texto; modalidad Elite/RX/Adv/Scaled o No aplica) y ranking.

## Pendiente (RFC)

shadcn/ui, PWA (`vite-plugin-pwa`), duplicar día/semana, plantillas.
