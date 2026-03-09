# SCAN Phase Check Configuration

## CEO Gate (--gate ceo)

Focus: functional — does it work end-to-end?

| # | Check | Command / Skill | What It Catches | Auto? |
|---|-------|----------------|----------------|-------|
| C0 | Pre-flight health | `.claude/scripts/sdd-preflight.sh` | Infra not ready | yes |
| C1 | Typecheck | `pnpm check-types` | Compile errors | yes |
| C2 | Unit tests | `pnpm test --run` | Broken logic | yes |
| C3 | Integration tests | `pnpm test --project integration` | Cross-module breaks | yes |
| C4 | E2E tests | `pnpm playwright test` | Broken user flows | yes |
| C5 | Browser QA | `/qa-validate` per domain | UX/flow issues | no (subjective) |

**C0 fail = abort entire SDD run.** No point running checks if DB is down.

### C5 Domain Processes (for /qa-validate invocations)

Each domain lists route groups from page-surface-registry. qa-validate visits ALL routes, fills forms, verifies DB writes, takes screenshots.

#### Infra (~18 routes)

```
/qa-validate "Platform admin and user management" --personas basic,tech-qa
```

Routes:
- Auth: /login, /register, /forgot-password
- Dashboard: /ops
- Admin: /ops/admin, /ops/admin/settings, /ops/admin/users, /ops/admin/users/invite
- Tenants: /ops/admin/tenants, /ops/admin/tenants/create
- RBAC: /ops/admin/roles
- Feature flags: /ops/admin/feature-flags
- Settings: /ops/settings, /ops/settings/choices
- Profile: /ops/profile
- Dev tools: /ops/dev, /ops/ui-showcase

#### MKS (~55 routes)

```
/qa-validate "Lead management, campaigns, support, CMS" --personas basic,tech-qa
```

Routes:
- CRM core: /ops/crm, /ops/crm/leads, /ops/crm/leads/create, /ops/crm/leads/[code]
- Companies: /ops/crm/companies, /ops/crm/companies/create, /ops/crm/companies/[code]
- Tasks: /ops/crm/tasks
- CRM settings: /ops/crm/settings/* (lead-sources, lead-levels, industries, loss-reasons, activity-types, task-types, tags, pipelines, segments, territories)
- Campaigns: /ops/communications/campaigns, .../create, .../[code]
- Nurture: /ops/communications/nurture, .../create, .../[code]
- Analytics: /ops/communications/analytics
- Templates: /ops/communications/templates, .../[id]/edit
- Delivery: /ops/communications/delivery, .../dlq
- Comms settings: /ops/communications/settings
- Support: /ops/support/tickets, .../create, .../[code]
- Escalations: /ops/support/escalations
- KB/FAQ: /ops/support/faq, /ops/support/kb
- CMS: /ops/cms/* (content, testimonials, forms, interests)
- Website: /, /khoa-hoc, /khoa-hoc/[slug], /blog, /lien-he, /ho-tro, /unsubscribe

#### LXP (~46 routes)

```
/qa-validate "Course catalog, enrollment, class scheduling, LMS" --personas basic,tech-qa
```

Routes:
- Courses: /ops/courses, /ops/courses/create, /ops/courses/[code]
- Classes: /ops/classes, /ops/classes/create, /ops/classes/[code]
- Enrollments: /ops/enrollments, .../create, .../[code], .../waitlist, .../deferrals, .../import
- LMS: /ops/lms/learning-paths, .../corrections, .../conflicts, .../cert-templates, .../certifications, .../audit
- Trainers: /ops/trainers, .../create, .../[code]
- Attendance: /ops/attendance/*
- Reports: /ops/reports, /ops/reports/sponsor, /ops/reports/trainers
- Learner portal: /learner/dashboard, /learner/courses, /learner/schedule, /learner/certificates, /learner/profile
- Trainer portal: /trainer/dashboard, /trainer/classes, /trainer/attendance, /trainer/materials, /trainer/profile
- Website: /lo-trinh, /giang-vien, /chung-nhan, /ho-so

#### Finance (~30 routes)

```
/qa-validate "Invoicing, payments, GL, financial reports" --personas basic,tech-qa
```

Routes:
- Billing: /ops/billing, /ops/billing/invoices/new, /ops/billing/invoices/[id]
- Orders: /ops/billing/orders
- Amoeba: /ops/amoeba, .../units, .../memberships, .../pnl, .../hours, .../pricing, .../dvp, .../config, .../simulations
- GL: /ops/finance/coa, .../journals, .../periods, .../trial-balance, .../deferred
- Tax/Payroll: /ops/finance/pit, /ops/finance/payroll
- Reports: /ops/finance/reports

### CEO Gate Pass Criteria
- C0: exit 0 (all infra healthy)
- C1-C4: all pass (0 failures)
- C5: 0 critical findings; medium/low may be deferred

---

## Dev Gate (--gate dev)

Focus: quality — can devs maintain this?

| # | Check | Command / Skill | What It Catches | Auto? |
|---|-------|----------------|----------------|-------|
| D1 | Typecheck | `pnpm check-types` | Compile errors (re-verify) | yes |
| D2 | Coverage analysis | `/qe-coverage` | Untested code paths | yes |
| D3 | Schema drift | `references/schema-alignment-check.md` per domain | Schema vs 04-spec divergence | yes |
| D4 | API drift | `references/api-alignment-check.md` per domain | Router vs 05-spec divergence | yes |
| D5 | Pattern conformance | `references/pattern-conformance-check.md` per domain | Convention violations | yes |
| D6 | Code review | `/code-review codebase` | Bugs, security, quality | no (subjective) |
| D7 | Doc consistency | Grep stale refs in docs/ | Outdated docs/refs | yes |
| D8 | Registry sync | `references/registry-sync-check.md` | Unregistered modules/entities/events | yes |
| D9 | Story coverage | `references/story-coverage-check.md` per domain | Unimplemented user stories | yes |
| D10 | Deprecated code | `references/deprecated-code-check.md` | Legacy patterns, deprecated APIs | yes |
| D11 | Route reconciliation | `pnpm --filter ops reconcile:routes` | Route drift (disk vs registry vs sidebar) | yes |

### D3-D5 Domain Mapping

Use trigger table for domain resolution:
- Infra: `04/05-*-infra.md`, modules: `infra/`
- MKS: `04/05-*-marketing-sales.md`, modules: `crm/`, `com/`, `cms/`, `sup/`
- LXP: `04/05-*-learning-experience.md`, modules: `lms/`
- Finance: `04/05-*-finance.md`, modules: `finance/`

### D7 Doc Consistency Checks

```bash
# Stale module references (common patterns)
grep -r "enrollment/" docs/ --include="*.md" | grep -v ".legacy"
grep -r "trainer/" docs/ --include="*.md" | grep -v ".legacy"
grep -r "adm_" docs/ --include="*.md" | grep -v ".legacy"
grep -r "bil_" docs/ --include="*.md" | grep -v ".legacy"
# Registry sync: entity count in YAML vs docs references
```

### Dev Gate Pass Criteria
- D1: pass
- D2: coverage report generated (thresholds advisory, not blocking)
- D3-D5: 0 HIGH findings per domain; MEDIUM may be deferred
- D6: score >= 7/10; critical findings must be fixed
- D7: 0 stale refs to renamed modules/prefixes
- D8: 0 HIGH registry sync gaps (unregistered modules/entities/events)
- D9: 0 HIGH story gaps (Must-have stories with no Done route)
- D10: 0 HIGH deprecated code items (deprecated APIs/prefixes in active code)
- D11: route reconciliation exit 0 (disk, registry, sidebar aligned)
