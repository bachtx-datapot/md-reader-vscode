# Planner Agent Memory

## Project: Datapot Operations Platform v2

- Event-driven modular monolith for Vietnamese vocational training centers
- Tech: Next.js 16 + Payload CMS 3.x + tRPC v11 + Drizzle ORM + PostgreSQL 16 + Redis 7
- Turborepo monorepo: `apps/ops` (main app), `apps/website`, `packages/*`
- 13 domain modules + 2 shared kernel modules (persons, master-data)
- Module code at `apps/ops/src/modules/{name}/`
- Shared code at `apps/ops/src/shared/`

## Key Architectural Decisions

- **Dual Drizzle**: Payload internal + Domain custom, shared pg Pool, table prefix convention
- **Auth**: Better Auth 1.4 (email/pass + Azure AD Entra) + Payload sync -> payload-token JWT cookie
- **API**: tRPC v11 + SERVICE LAYER MANDATE (logic in services/, not handlers)
- **Events**: Transactional outbox (ADR-009) + BullMQ. 2 queues: datapot-outbox-events, datapot-events (legacy)
- **Module isolation**: 4-layer (barrel exports, eslint-plugin-boundaries, arch tests, code review)
- **GraphQL**: Kept enabled with hardening (depth limit, no introspection in prod)
- **Persons**: `prs_persons` table in `modules/persons/` (NOT shared/ — it's a module)
- **Master data**: `md_*` tables in `modules/master-data/`, choices registry for all status/enum values

## Existing Infrastructure (Sprint 0 finding: 2026-02-19)

Most Sprint 0 infra ALREADY BUILT. Key existing files:
- DB: `shared/db/` (connection-pool, drizzle, base-columns)
- Auth: `shared/auth/` (better-auth-config, payload-sync, token-exchange, access-control, roles, server)
- Events: `shared/events/` (outbox-producer, outbox-worker, consumer-registry, event-bus legacy)
- Cache: `shared/cache/redis-client.ts` (ioredis singleton)
- Casbin: `shared/casbin/` (enforcer, RBAC model, policy sync)
- tRPC: `trpc/` (init, context, procedures, router, server, client, react, query-client)
- Schema registry: `src/db/schema-registry.ts` (aggregates all module schemas)
- All domain module skeletons exist with schema, services, routers

## Module Prefixes

cms_, crm_, fin_ (billing+GL+MAC+PIT), lms_ (unified: enrollment+lms+trainer), com_, inf_ (was adm_), gl_, md_, prs_
- bil_/amb_ DB table renames to fin_ DONE (migrations 0022+0023)
- Drizzle variable names still use bil*/amb* prefix (code rename pending as of 2026-02-21)

## Plan Structure Convention

- plan.md (overview, <80 lines) + phase-XX-name.md files
- Each phase: context links, overview, files to create, implementation steps with code snippets, todo checkboxes, success criteria, risks
- Phase files under 200 lines (concise, sacrifice grammar)
- YAML frontmatter required on plan.md

## File Paths (Key)

- Code standards: `docs/code-standards.md`
- System architecture: `docs/system-architecture.md`
- Database design: `docs/database-design.md`
- Schema conventions: `docs/schema-conventions.md`
- Event conventions: `docs/event-conventions.md`
- ADRs: `docs/adr/`
- Registry: `docs/product/registry/` (modules.yaml, en-entities.yaml, ev-events.yaml)
- Brainstorm reports: `plans/reports/brainstorm-*.md`
- Payload config: `apps/ops/src/payload.config.ts`
- Main tRPC router: `apps/ops/src/trpc/router.ts`

## Roles (10)

super-admin, admin, sales-manager, sales, coordinator, trainer, finance, support, student, corporate-contact

## SDD Framework (2026-03-01)

- SDD (Scan-Do-Done) replaced TMB v2 at `.claude/skills/trust-me-bro/`
- TMB v2 archived at `.legacy/trust-me-bro-v2/`
- Two sequential gates: `--gate ceo` (functional: typecheck, tests, E2E, browser QA) then `--gate dev` (quality: coverage, schema/API drift, pattern conformance, code review, doc consistency)
- Issue registry is the backbone (every finding: ID + evidence + root_cause + owner + status)
- State file: `quality-reports/sdd-{run-id}/sdd-state.yaml` (ralph-loop.sh compatible)
- Curated output: `plans/handoff/` (git-tracked: issue-registry, gate summaries, known-debt)
- DO phase always uses `/cook`; smart-retry + circuit-breaker per issue
- Downstream skills (no changes): qa-validate, qe-coverage, code-review
- Plan: `plans/260301-1418-sdd-framework/`

## Lessons Learned

- Always check existing code before planning — this project has substantial infra already built
- Persons module is at `modules/persons/` not `shared/persons/` — it's a module with its own router
- Main router at `trpc/router.ts` — persons router NOT registered there (gap found Sprint 0)
- Payload tablesFilter uses allowlist pattern — domain tables excluded from Payload push
- Finance domain: DB tables already fin_ prefixed but TS vars still bil*/amb* — plan at plans/260221-1405-fin-sprint/
- Billing tables use fin_ DB names but bilInvoice/bilPayment TS variable names (pgTable('fin_invoice') with bilInvoice var)
- MAC tables same pattern: ambAmoebaUnit var but pgTable('fin_amoeba_unit')
- GL module is empty stubs (router, schema, services all empty/minimal) — ready for build
- Billing already emits 5 of 6 events (fin.payment.failed missing)

## LPV (Learning Path Offering) — 2026-03-02

- Plan: `plans/260302-0813-lpv-phase1-implementation/`
- LPV = cohort instance of LP (like Class = instance of Course)
- 2 new tables: `lms_learning_path_offering`, `lms_lp_offering_item`
- Placeholder class convention: `{courseCode}-XX` suffix, no extra boolean column
- Eager enrollment: classId always NOT NULL (real or placeholder)
- LPV code pattern: `{LP_productCode}-{NNN}` (e.g. DAFD-085)
- No priceOverride on LPV — course owns price
- LPV is flat — sub-programs flattened at creation time
- Events: lms.lp_offering.created, .published (->CMS variant), .class_assigned
- `lms_learning_path_enrollment` gets new `lpOfferingId` column for traceability
- `fulfillLearningPath()` already accepts classIds param (line 27 LP enrollment svc) — LPV wires it
- CMS variants collection generalized: `variantType` discriminator (class vs lp_offering)
- LMS main router: `modules/lms/router.ts` uses spread `..._def.record` pattern for sub-routers
