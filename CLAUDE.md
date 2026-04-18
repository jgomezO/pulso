# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Regla #0 — OBLIGATORIA: Usar skills de .claude/skills/

SIEMPRE usar las skills locales del proyecto en `.claude/skills/` según el contexto de la tarea.
Estas skills se activan automáticamente, NO necesitan invocación manual.

| Skill | Cuándo usarla |
|---|---|
| **heroui-react** | Al crear o modificar componentes UI con HeroUI v3. Consultar docs del skill ANTES de implementar. |
| **heroui-migration** | Al migrar patrones de HeroUI v2 a v3 o corregir usos deprecated. |
| **frontend-design** | Al crear páginas, landing pages, dashboards o cualquier UI nueva que requiera diseño distintivo y producción. |
| **brand-guidelines** | Al aplicar estilos de marca Anthropic a artefactos (colores, tipografía, identidad visual). |
| **theme-factory** | Al estilizar slides, docs, reportes o artefactos con un tema visual. Hay 10 temas predefinidos. |
| **webapp-testing** | Al testear la webapp con Playwright (screenshots, verificación de UI, debugging, browser logs). |
| **skill-creator** | Al crear, mejorar, evaluar o optimizar skills. |

### Reglas de uso:
- Leer el SKILL.md correspondiente ANTES de ejecutar cualquier tarea que aplique
- Para **heroui-react**: SIEMPRE consultar docs via `node scripts/get_component_docs.mjs <Component>` antes de usar un componente
- Para **webapp-testing**: usar los scripts bundled como black boxes (`--help` primero)
- Para **frontend-design**: seguir sus guidelines de tipografía, color y motion — NO usar fuentes genéricas (Inter, Arial, Roboto) en diseños nuevos creativos
- NUNCA ignorar estas skills cuando el contexto aplica

## Build & Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npx vitest           # Run all tests
npx vitest run path/to/file.test.ts   # Run single test file
npx vitest --watch   # Watch mode
```

## Architecture Overview

**Pulso** is a Customer Success Management SaaS platform. It tracks customer accounts, health scores, success plans, tasks, and integrates with HubSpot/Intercom. AI features (via Claude API) generate account summaries and health explanations.

### Clean Architecture Layers

- **domain/** — Pure entities (Zod schemas) and repository interfaces. No external dependencies.
  - `account/` (Account, HealthScore, AccountRepository)
  - `contact/`, `task/`, `plan/`, `event/`
  - `shared/types.ts` — PaginationParams, PaginatedResult<T>, Result<T,E>

- **application/** — Use cases orchestrating domain + infrastructure
  - `CalculateHealthScore` — weighted signal aggregation, trend detection, risk mapping
  - `GetAccountOverview` — composes account + contacts + events
  - `GenerateAccountSummary`, `SyncHubSpot`, `SyncIntercom`

- **infrastructure/** — Concrete implementations
  - `db/` — Supabase repository implementations (AccountRepositorySupabase, etc.)
  - `db/supabase.ts` — `supabase` (anon/client) and `createServiceClient()` (service role/server, bypasses RLS)
  - `ai/` — Anthropic SDK setup, prompt templates, AccountSummarizer, HealthScoreExplainer
  - `integrations/hubspot/`, `integrations/intercom/` — Clients + Mapper pattern (DTO -> domain)

- **lib/** — Utilities and state
  - `health-score/` — calculator, weights (product_usage 30%, support 20%, engagement 20%, nps 15%, payment 10%, stakeholder 5%), config
  - `supabase/client.ts` (browser), `supabase/server.ts` (server-side)
  - `store/accountStore.ts` — Zustand store (selectedAccount, orgId)
  - `icons.ts` — Centralized Gravity UI icon re-exports
  - `utils/format.ts`, `utils/date.ts`

- **hooks/** — SWR-based data fetching hooks (useAccount, useHealthScore, useTimeline, useUsers, useAccountSummary, useCurrentUser)

- **components/** — React UI
  - `shared/` — DatePickerField, Icon, AIInsightCard, LoadingSkeleton, EmptyState
  - `layout/` — SidebarShell, Sidebar, TopBar
  - `accounts/` — AccountForm, AccountTable, HealthScoreBadge, HealthScoreChart, ContactsSection, TasksSection, PlansSection, CSVImporter, etc.
  - `plans/` — PlanCard, PlanDetail, NewPlanModal

### App Router Structure

- `app/(auth)/login/` — Login page
- `app/(dashboard)/` — Protected layout (Supabase auth check, SidebarShell)
  - Dashboard home, accounts (list/detail/new/edit/import), tasks, settings
- `app/api/` — RESTful API routes with Zod validation on all inputs

### Multi-tenancy

All tables use RLS with `org_id` isolation via JWT `app_metadata.org_id`. Server-side operations use `createServiceClient()` to bypass RLS when needed.

### Database

Supabase Postgres. Migrations in `supabase/migrations/`. Core tables: organizations, accounts, contacts, account_events, health_score_history, account_ai_summaries, integration_configs, success_plans, plan_milestones, account_tasks.

---

# Pulso — Reglas de desarrollo

## Regla #1 — OBLIGATORIA: Usar componentes HeroUI para TODOS los elementos de UI

NUNCA usar elementos HTML nativos para formularios o UI. SIEMPRE usar el
componente HeroUI equivalente. Sin excepciones.

### Mapa de reemplazos obligatorios:

| HTML nativo (PROHIBIDO)           | HeroUI (OBLIGATORIO)                     |
|-----------------------------------|------------------------------------------|
| `<input type="text">`             | `<Input>` de `@heroui/react`             |
| `<input type="number">`           | `<Input type="number">` de `@heroui/react`|
| `<input type="date">`             | `<DatePicker>` de `@heroui/react`        |
| `<input type="email">`            | `<Input type="email">` de `@heroui/react`|
| `<select>`                        | `<Select>` + `<SelectItem>` de `@heroui/react` |
| `<textarea>`                      | `<Textarea>` de `@heroui/react`          |
| `<input type="checkbox">`         | `<Checkbox>` de `@heroui/react`          |
| `<input type="radio">`            | `<RadioGroup>` + `<Radio>` de `@heroui/react` |
| `<button>`                        | `<Button>` de `@heroui/react`            |
| `<table>`                         | `<Table>` de `@heroui/react`             |
| `<dialog>` o modal custom         | `<Modal>` de `@heroui/react`             |
| Toggle / switch custom            | `<Switch>` de `@heroui/react`            |
| Tooltip custom                    | `<Tooltip>` de `@heroui/react`           |
| Dropdown custom                   | `<Dropdown>` de `@heroui/react`          |
| Tabs custom                       | `<Tabs>` + `<Tab>` de `@heroui/react`   |
| Badge / chip custom               | `<Chip>` de `@heroui/react`             |
| Progress bar custom               | `<Progress>` de `@heroui/react`          |
| Skeleton custom                   | `<Skeleton>` de `@heroui/react`          |
| Alert/notification custom         | `<Alert>` de `@heroui/react` o `addToast` |

### DatePicker — HeroUI v3 es headless (API compound, NO simple)

HeroUI v3 (`@heroui/react@3.x`) NO tiene `<DatePicker label="..." variant="bordered"/>`.
Esas props son de NextUI v2 / HeroUI v2. Intentar usarlas hace que el componente no renderice.

**SIEMPRE usar nuestro componente wrapper:**

```tsx
import { DatePickerField } from "@/components/shared/DatePickerField"
import type { DateValue } from "@internationalized/date"
import { parseDate } from "@internationalized/date"

// Estado
const [fecha, setFecha] = useState<DateValue | null>(null)

// Uso
<DatePickerField
  label="Fecha de renovación"
  value={fecha}
  onChange={setFecha}
/>

// Conversiones
// String ISO → DateValue: parseDate("2024-12-31")
// DateValue → String ISO: date.toString()
```

El componente `DatePickerField` en `components/shared/DatePickerField.tsx` usa:
- `DateField.Group` como contenedor visual con border (via `.date-input-group` CSS) — también attachea el `groupRef` que usa el Popover para posicionarse
- `DateField.Input` para edición de segmentos por teclado
- `CalendarButton` (componente interno): botón nativo que usa `DatePickerStateContext` de `react-aria-components` para llamar `state.setOpen()` directamente

Por qué NO usar `DatePicker.Trigger`:
- Es un `<button>` que normalmente envuelve los DateSegments (role="spinbutton")
- Poner elementos interactivos dentro de un `<button>` es HTML inválido
- Los browsers rompen el event bubbling → el click nunca llega al trigger

NUNCA:
- Usar `<DatePicker label="..." variant="bordered" .../>` (no existe en HeroUI v3)
- Usar `DatePicker.Trigger` envolviendo `DateField.Input` (HTML inválido, click roto)
- Usar `<input type="date">` o `<input type="datetime-local">` nativo
- Mezclar CalendarDate con Date nativo de JavaScript

### Select — Reglas específicas:

```tsx
import { Select, SelectItem } from "@heroui/react"

<Select
  label="Tier"
  placeholder="Seleccionar"
  variant="bordered"
  labelPlacement="outside"
  selectedKeys={value ? [value] : []}
  onSelectionChange={(keys) => setValue(Array.from(keys)[0] as string)}
  classNames={{ base: "w-full" }}
>
  <SelectItem key="enterprise">Enterprise</SelectItem>
  <SelectItem key="growth">Growth</SelectItem>
</Select>
```

NUNCA usar `<select>` HTML nativo.

### Props estándar para TODOS los campos de formulario:
- variant="bordered"
- labelPlacement="outside"
- classNames={{ base: "w-full" }} cuando debe ocupar el ancho completo

## Regla #2 — Sistema visual

- SIN SOMBRAS: Nunca usar shadow-*, drop-shadow, box-shadow
- Bordes: border border-[#ECEEF5] para cards y separadores
- Border radius: rounded-[14px] para cards, rounded-xl para inputs/botones
- Fondo de página: bg-[#F7F8FC]
- Fondo de cards: bg-white
- Color primario: #4F6EF7
- Tipografía: font Inter

## Regla #3 — Stack técnico

- Framework: Next.js 14 App Router + TypeScript estricto
- UI: HeroUI + Tailwind CSS
- DB: Supabase (Postgres + Auth)
- AI: Anthropic Claude API (claude-sonnet-4-6)
- Validación: Zod en TODOS los inputs de API
- Estado global: Zustand
- Charts: Recharts
- Sin `any` en TypeScript — usar tipos explícitos siempre

## Regla #4 — Arquitectura

- domain/ → Entidades y repositorios (interfaces) — sin dependencias externas
- application/ → Casos de uso
- infrastructure/ → Implementaciones de DB, AI, integraciones
- components/ → Componentes React específicos de Pulso
- hooks/ → Custom hooks
- lib/ → Utilidades y lógica pura

## Regla #5 — Antes de crear cualquier componente

1. Verificar si HeroUI tiene un componente equivalente en heroui.com/docs
2. Si existe: usarlo con variant="bordered" y los props estándar
3. Si no existe: crear componente custom siguiendo el sistema visual
4. NUNCA crear componentes custom para: inputs, selects, datepickers,
   tablas, modals, tabs, dropdowns — HeroUI los tiene TODOS

## Regla #6 — Íconos: SOLO Gravity UI vía lib/icons.ts

NUNCA usar emojis, Unicode symbols, o librerías de íconos diferentes.
SIEMPRE usar Gravity UI icons importados desde `lib/icons.ts`.

### Cómo usar íconos:

```tsx
// IMPORT — siempre desde lib/icons.ts, nunca desde @gravity-ui/icons directo
import { IconEdit, IconWarning, IconHealth } from '@/lib/icons'
import { Icon } from '@/components/shared/Icon'

// USO
<Icon icon={IconEdit} />                                          // 16px default
<Icon icon={IconWarning} size={20} className="text-amber-500" /> // 20px con color
<Icon icon={IconHealth} size={24} />                             // 24px
```

### Reglas:
- Importar SIEMPRE desde `@/lib/icons` — NUNCA directo de `@gravity-ui/icons`
- Si necesitas un ícono nuevo: agrégalo primero a `lib/icons.ts` con alias descriptivo
- Tamaños: 16px para inline/badges, 20px para navegación, 24px para headers
- Color: heredar del padre por defecto, usar `className` de Tailwind para color explícito
- NUNCA usar emojis (🔔 ⚠️ ✅ etc.) ni Unicode symbols (● ▲ ★ → ↑ ↓ etc.)
- NUNCA usar Lucide, Heroicons, FontAwesome o cualquier otra librería de íconos
