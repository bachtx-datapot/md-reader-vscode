# Code Reviewer Memory

## Project Conventions
- tRPC router in `src/trpc/router.ts` — new routers must be mounted here to be accessible
- Permission model: `permissionProcedure(resource, action)` uses Casbin enforcer (not role-check)
- Outbox canonical pattern: `emitOutboxEvent(tx)` for transactional callers, `emitOutboxEventDirect(db)` for non-transactional
- Event emitters use Zod `.parse()` on payloads before insert — standard defensive pattern
- Dead letter service lives in `shared/events/dead-letter-service.ts`, router in `shared/events/event-router.ts`

## Recurring Issues to Check
- `sql.raw()` is never safe — always flag; Drizzle's `inArray()` or parameterized sql tag are safe alternatives
- Count-based sequence generation (COUNT(*)+1 for cert/code numbers) is not concurrency-safe — flag as TOCTOU
- Soft-deleted related entities in JOINs: always check joined table's `isDeleted` too, not just the primary table
- `autoLog`/`autoGenerate` batch methods triggered by events: must have idempotency guard or ON CONFLICT DO NOTHING
- No-op stubs that return success: always flag — callers assume work was done
- Error mapper coverage: when a module has multiple error files (lms-errors.ts + trainer-profile-errors.ts), verify ALL error classes from ALL files appear in the unified mapLmsError — split error files are a recurring miss
- Drizzle multi-condition WHERE: always verify `and(...conditions)` is used, not `conditions[0]`
- `purgePublished`-style mutations: verify cutoff date IS included in WHERE, not just computed
- `row!.id` non-null assertions after INSERT returning — verify guard or note risk
- `getStats` / count queries: check for duplicate queries returning same data with different labels
- Multi-tenant data leakage: listActive-style methods must filter by tenantId in WHERE
- TOCTOU in read-then-write service methods: guard checks outside transactions are vulnerable
- RBAC mutations: always check cross-entity tenant ownership (roleId, permissionId must belong to ctx.tenantId)
- isSystem guard: verify present on ALL mutation paths (create/update/delete/assignPermission/removePermission)
- Event emission after idempotent service calls: gate on returned bool — don't fire if no change occurred
- Casbin resource field: free-text string can contain `|` delimiter — must restrict to safe charset

## Architecture Notes
- Two BullMQ queues: `datapot-outbox-events` (outbox worker + consumer-registry) and `datapot-events` (legacy event-bus — deprecated)
- `event-bus.ts` onEvent/startEventBus = legacy path, consumer-registry.ts registerHandler = canonical
- `MAX_ATTEMPTS=5` in outbox-worker guards publish failures only, NOT downstream BullMQ consumer failures
- File size limit: 200 lines — management-accounting/router.ts was 460 (now split into amoeba-sub-router.ts + calc-sub-router.ts)
- BullMQ concurrency: consumer-registry and event-bus both set to 10 (upgraded from 5 in 2026-02-25 audit)

## E4 Review Summary (2026-02-20)
Score: 7.5/10. No critical bugs. High: cross-tenant ID injection in assignPermissionToRole (no ownership check on roleId/permissionId), isSystem guard missing in permission mutation, TOCTOU in idempotency check. Medium: event fires on no-op assignment, full sync() on single operation is expensive, no role.delete endpoint, free-text resource field allows Casbin injection. See full report: `plans/260220-1731-plt-sprint/reports/E4-code-review.md`

## E5 Review Summary (2026-02-20)
Score: 6.5/10. Critical bugs: purgePublished ignores cutoff, listOutbox drops conditions, eventRouter not mounted. See full report: `plans/260220-1731-plt-sprint/reports/E5-code-review.md`

## LMS Sprint 4+5 Review (2026-02-21)
v1 Score: 7.0/10. Critical: sql.raw() SQL injection in getCompletionDashboard, getPublicPage password param accepted but never verified (cert publicly readable). High: TrainerConflictError missing from unified mapLmsError (thrown → unhandled), count-based cert number generation is TOCTOU. Medium: enroll stub returns success with no action, autoLogFromClass lacks idempotency, soft-deleted engagements not excluded from listByTrainer JOIN. See full report: `plans/reports/code-review-lms-sprint-e5-e6.md`
v2 Score: 8.0/10. All 4 critical/high fixes confirmed correct. No new issues introduced. Remaining: enroll stub no-op, autoLogFromClass no idempotency, N+1 in getStudentProgress, CertificationPasswordError dead code, file size violation. See `plans/reports/code-review-lms-sprint-e5-e6-v2.md`

## FIN Sprint E2+E3+E4 Review (2026-02-21)
Score: 6.5/10. Critical: emitOutboxEventDirect(this.db,...) called INSIDE this.db.transaction() in checkOverdue() — non-atomic (outbox on different pool connection). High: double-event on idempotent payment replay (event guard must check isNew flag), fin.payment.received payload missing enrollmentId/paidAt breaks LMS enrollment activation via ZodError, MAC consumer uses onEvent() (legacy bus) so never receives outbox events. Medium: drizzle.config.ts retains amb_* in tablesFilter after migration renames them to fin_*. See `plans/reports/FIN-E2-E3-E4-code-review.md`
- Pattern: emitOutboxEvent(tx) inside tx; emitOutboxEventDirect(db) OUTSIDE tx — mixing them causes atomicity loss
- Pattern: idempotent tx returns must track isNew flag so caller doesn't re-emit events on replay

## E8 Review Summary (2026-02-20)
Score: 7.5/10. No critical bugs. High: filterByPermission passes role name (not userId) to enforcer.enforce — diverges from procedures.ts pattern; permissionRequired field missing format regex allowing Casbin `|` injection. Medium: redis.keys() O(N) blocking on invalidation, orphaned empty parent nodes shown to users, seed guard not transactional (race on concurrent startup), reorder silent no-op on invalid IDs. See full report: `plans/reports/reviewer-E8-menu.md`
- Casbin enforce call pattern: ALWAYS pass userId (not role string) as subject — role resolution is done by `g()` in the model matcher

## GL Module Review (2026-02-21)
Score: 7.0/10. Critical: COUNT+1 entry number TOCTOU (3 locations), onConflictDoUpdate fails with partial unique index (WHERE isDeleted). High: event payload mismatch vs Zod schema (missing tenantId/sourceType/postedAt), DeferredRevenueService.recognize skips finAccountBalance update (trial balance blind), reverse() not transactional (partial failure = inconsistent state). Medium: no date format validation, enum types not enforced in routers, seed not transactional, dead code (CoaService.seed stub + TrialBalanceService unused). See `plans/reports/code-review-gl-module.md`
- Pattern: Drizzle onConflictDoUpdate with partial unique index (WHERE clause) does NOT work — Postgres requires exact index match; use SELECT+UPDATE/INSERT instead
- Pattern: services that create JEs inline (bypassing JournalService.post) must also update finAccountBalance — otherwise trial balance is blind to those entries

## FIN-2 GL Core Build Review (2026-02-21)
Score: 8.5/10. No critical bugs. Prior findings (C-1 TOCTOU entry number, H-2 missing balance update) confirmed fixed. High: correlationId stored on JE but no duplicate guard before INSERT — BullMQ retry will produce duplicate JEs (idempotency claim in comment is false); paymentStatus hardcoded 'completed' instead of read from payload. Medium: GlAutoJournalService.findAccountByCode queries this.db outside tx; CoA seed not transactional (partial failure leaves incomplete CoA + idempotency guard blocks re-seed); fin_fct_subledger missing tenant_id index; multi-schedule fan-out in handleSessionCompleted undocumented. See `plans/reports/code-reviewer-260221-fin2-gl.md`
- Pattern: BullMQ consumer idempotency MUST be enforced by correlationId duplicate check inside the transaction before INSERT, not just by storing correlationId — a retry after partial failure WILL create a duplicate JE otherwise
- Pattern: concurrent recognize() calls can double-count — requires SELECT FOR UPDATE on schedule row or optimistic WHERE recognized_sessions = $expected guard
- Pattern: seed loops without wrapping transaction + idempotency guard that checks first item = partial failure is unrecoverable (guard fires, loop skipped, data incomplete)

## PIT/Payroll Review (2026-02-21)
Score: 7.0/10. Critical: 5 methods missing tenantId in WHERE (approveLine, submitDeclaration, listByPeriod, listOwn, calculateBatch) — cross-tenant data leakage/mutation. High: zero transactions in multi-step financial workflow (TOCTOU on closePeriod/declare), empty-period declaration allowed, labor PIT passes grossAmount instead of taxableIncome (deductions not applied — 5-7x overtax), permission levels diverge from spec. See `plans/reports/code-review-260221-1506-pit-payroll.md`
- Pattern: when service method accepts tenantId param but query WHERE doesn't use it — ALWAYS flag as tenant isolation gap; grep for `tenantId.*string` in method signature then confirm each query uses it
- Pattern: financial multi-step operations (check-then-mutate) MUST use transactions — payroll is especially high-risk due to concurrent HR+manager workflows

## Learner Portal Phase 1 Review (2026-02-22)
Score: 7.0/10. Critical: middleware matcher missing `/learner/:path*` (auth/role bypass), learner layout has duplicate `<html><body>` tags. High: session reminder job is no-op stub (console.log only), no idempotency guard for reminder dispatch, job never registered at startup. See `plans/reports/code-review-260222-learner-portal-phase1.md`
- Pattern: Next.js middleware matcher must include ALL protected route prefixes — `PROTECTED_PREFIXES` array is necessary but insufficient without matching matcher config
- Pattern: Next.js route group layouts must NOT render `<html>/<body>` — only root layout owns those tags
- Pattern: BullMQ jobs sharing queue name (`platform-jobs`) must verify `job.name` in worker handler — silent swallowing risk

## Perf Optimization Review (2026-02-23)
Score: 7.5/10. No critical bugs. High: PgBouncer SERVER_RESET_QUERY DISCARD ALL dead in tx mode (dangerous if forced), x-request-id accepted from external headers without validation (log injection). Medium: turbopackFileSystemCacheForDev redundant in Next.js 16.1+, Redis allkeys-lru may evict BullMQ keys, pg_stat_statements needs shared_preload_libraries, redisClient! race in async connect handler. See `plans/reports/code-review-260223-0102-perf-optimization.md`
- Pattern: Next.js 16 renames middleware.ts to proxy.ts, export function proxy() — this is the official convention
- Pattern: PgBouncer tx mode ignores SERVER_RESET_QUERY since v1.7 — setting DISCARD ALL is misleading/dangerous
- Pattern: Redis allkeys-lru evicts ALL keys including BullMQ job data — use volatile-lru to only evict TTL'd cache keys
- Pattern: x-request-id from external sources must be validated (UUID regex) — arbitrary strings enable log injection
- Pattern: pg_stat_statements requires shared_preload_libraries in postgresql.conf — CREATE EXTENSION alone is not enough

## Nav Reconciliation Review (2026-02-23)
Score: 7.5/10. No critical bugs. High: communications layout blocks `sales` role but sidebar nav shows items to `sales` (redirect loop UX), duplicate RBAC resource `inf:email-templates` vs `com:templates`, no finance layout guard for GL pages. Medium: dead cmpRouter export, stale page-surface-registry.md routes, sidebar-config.ts 236 lines (over 200 limit), excessive `as any` in campaign detail. See `plans/reports/code-reviewer-nav-reconciliation-report.md`
- Pattern: Next.js layout.tsx role guards MUST match sidebar-config.ts role arrays — mismatch = users see nav items but get redirected
- Pattern: after route migration (path rename), update page-surface-registry.md AND check proxy.ts for redirect rules for old bookmarks
- Pattern: RBAC registry must not have two resources for the same domain concept — duplicate resources cause confusion in seed/Casbin sync
- tRPC client import: `@/trpc/client` exports `trpcReact as trpc`; both `trpc` and `trpcReact` are valid in client components

## Registry Cleanup Phase 1 Review (2026-02-24)
Score: 8.0/10. No critical bugs. High: init.sql has 32 `idx_bil_*` index names while Drizzle schema now expects `idx_fin_*` — fresh deploy creates wrong-named indexes causing drizzle-kit mismatch. Medium: `last_updated` stale in both YAML registries, 20+ docs still reference old `event_outbox` (code is correct `inf_event_outbox`). See `plans/reports/code-review-260224-registry-cleanup-phase1.md`
- Pattern: When renaming Drizzle index strings in schema files, MUST also rename matching CREATE INDEX in `0000_init.sql` — pre-production init is the source of truth for fresh deploys
- Pattern: YAML registry `_meta.last_updated` must be bumped on every modification — easy to miss on registry-only PRs

## Full-Stack Audit Remediation Review (2026-02-25)
Score: 8.0/10. No critical bugs. High: generateEntityCode TOCTOU (MAX+1 with no retry on 23505 constraint violation), init.sql has 218 stale `amb_*` references (schema says `fin_*`), init.sql CHECK still says `cmp_cart_abandoned` (code says `com_cart_abandoned`), 6 of 7 split files still over 200 LOC. Medium: numeric(15,2) returns strings from Drizzle (downstream consumers may expect number), DVP getTrailing uses inline role check instead of Casbin, baseColumns adoption silently adds columns to existing tables. See `plans/reports/code-review-260225-full-stack-audit-remediation.md`
- Pattern: `generateEntityCode()` at `shared/utils/generate-entity-code.ts` — MAX+1 approach; unique index catches races but error not handled; add retry on 23505
- Pattern: Drizzle `numeric()` columns return JS strings — always verify consumers parse with Number() or add `.mapWith(Number)`
- Pattern: ensureTenant middleware now active on all protectedProcedure/permissionProcedure chains — tenant filtering is defense-in-depth (middleware + service-layer)
- Pattern: `createModuleLogger()` is now the standard; ESLint `no-console: warn` enforces migration

## Storybook App Context
- Storybook at `apps/storybook/`, config: `.storybook/main.ts` (react-vite)
- Stories: `stories/primitives/`, `stories/recipes/`, `stories/surfaces/`, `stories/brand/`
- Design tokens: `packages/design-tokens/` — V2 Microsoft Modern, OKLCH color space, Fluent 2
- Token layers: `tokens.css` → `semantic.css` → `products/*.css` → `dark.css`
- Build validation: `npx storybook build --quiet` from `apps/storybook/`
- Known: `public-components.css` 813 lines (over limit), pre-existing hex colors not migrated to OKLCH

## Website App Context
- Website: `apps/website/` (Next.js App Router)
- Payload REST client: `apps/website/src/lib/payload-client.ts` — all CMS reads + `callOpsMutation()` for cross-origin tRPC
- Payload collection overrides: `apps/ops/src/modules/cms/collections/overrides/`
- Payload table views: `apps/ops/src/shared/db/payload-table-views.ts`
- `depth=1` expands relationship fields; multiple pages share `listUpcomingClasses()`
- Known issues: unsafe `as Type[]` casts on Payload responses, mapping functions duplicated per consumer
- TypeScript check: `pnpm --filter website exec tsc --noEmit` (`.next/dev/types/routes.js` error is benign)
- Guest session: `apps/website/src/lib/session-id.ts` — httpOnly cookie `datapot_session_id`, 30d TTL
- Cart page: server component fetches auth/guest cart, delegates interactive to `CartPageClient`

## Order Management UX Review (2026-02-27)
Score: 7.5/10. Critical: `createDirect` hardcodes `paymentModel:'prepay'` ignoring UI dropdown selection; `guestOrderStatus` public endpoint enables email enumeration. High: `PAYMENT_MODEL_LABELS` missing `corporate_po` key (raw string shown), `ORDER_STATUS_VI` duplicated 3x, `updatePending` email change has no audit trail. Medium: `Record<string,any>` Order type loses safety, `formatVnd` duplicated 5+ times, promo code flow sends string to UUID-expecting endpoint. See `plans/reports/code-review-260227-0604-order-management-ux-fix.md`
- Pattern: when UI form schema allows N options but mutation call hardcodes one value — always flag as data integrity risk
- Pattern: public endpoints accepting email as auth factor enable enumeration — prefer one-time tokens (Redis TTL'd) over email match
- Pattern: label maps (STATUS_LABELS, MODEL_LABELS) MUST cover all enum values from types file — missing keys show raw English strings to Vietnamese users
- Pattern: `callOpsMutation()` in payload-client.ts is the canonical way for website to call ops tRPC mutations cross-origin

## Schema Data Integrity Audit (2026-02-27)
Score: 7.0/10. 127 pgTable definitions across 10+ modules. See `plans/reports/code-review-260227-1637-schema-data-integrity.md`
- All VND money columns correctly use `bigint({ mode: 'number' })` -- no money-type violations
- 16 `numeric()` columns are all non-money (rates, scores, hours) -- acceptable but return JS strings
- 6 files use `sql\`gen_random_uuid()\`` instead of `.defaultRandom()`: sup/escalation-log, sup/ticket-comment, cms/event, cms/case-study, com/template-version, com/bounce-record
- 12 domain tables missing baseColumns entirely (all in sup, cms, com modules from MKS sprint E7-E9)
- 10 domain tables have NO tenantId at all -- tenant isolation gap
- GL child tables (journal-entry-line, payroll-line, deferred-revenue-schedule, fct-subledger) missing tenant-prefixed indexes
- Zero pgEnum usage -- perfect compliance
- 22+ entities have proper `code varchar(30)` columns with tenant-scoped unique indexes
- Pattern: MKS sprint (E7-E14) tables consistently missed baseColumns adoption -- batch fix needed

## Services Business Logic Audit (2026-02-27)
Score: 7.0/10. 150+ service files, 35+ event handlers. See `plans/reports/code-review-260227-1637-services-business-logic.md`
- Critical: ClassCloseService (proposeClose/approveClose/rejectClose) does multi-table writes without transaction
- Critical: ClassService.transition() does UPDATE + INSERT(history) without transaction
- Critical: handleOrderPaid() missing tenantId in WHERE (cross-tenant data leakage)
- High: 14 onEvent() consumers in com + MAC modules are deaf — never receive outbox events (must migrate to registerHandler)
- High: PaymentScheduleService.markPaid() missing tenantId in WHERE
- High: GL generateEntryNumber() has no retry on 23505 (unlike generateEntityCode which does)
- Positive: 0 console.log in services/events/routers/jobs; 0 sql.raw(); 0 publishEvent(); 98% tenant isolation compliance
- Pattern: multi-step class status changes (transition + history + event) MUST be atomic — wrap in db.transaction()
- Pattern: event handler queries reading by UUID must STILL include tenantId in WHERE for defense-in-depth
- File size: 61 of ~150 service files exceed 200 LOC limit (worst: lead-service 491, class-service 476)

## Frontend UI Quality Review (2026-02-27)
Score: 7.0/10. No critical XSS. CMS sanitization solid. See `plans/reports/code-review-260227-1639-frontend-ui-quality.md`
- sanitize-html allows `style` on `*` — enables CSS-based exfil; restrict to allowedStyles
- Route naming: `[id]` (admin/users), `[classId]` (learner), `[orderId]` (cam-on) — should be `[code]`
- 70 files over 200 LOC (55 ops + 15 website); top: course-lesson-editor 388
- Website: ZERO route-level error boundaries, ZERO loading.tsx
- data-testid: 30/403 ops TSX files (7.4%) — E2E gap
- 30+ website pages use `export const revalidate` — breaks if cacheComponents enabled
- Zero `as any` in frontend TSX; all `_blank` links have rel=noopener; proxy.ts correct
- Pattern: sanitize-html `'*': ['style']` risky — use allowedStyles with explicit CSS props
- Pattern: website needs route-group error.tsx (payment/order flows especially)
