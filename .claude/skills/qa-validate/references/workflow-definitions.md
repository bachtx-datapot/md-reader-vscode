# Workflow Definitions — Cross-Domain Business Flows

Catalog of end-to-end workflows for the workflow persona.
Each workflow defines sequential steps, roles, routes, events, and DB tables.

**When to use:** Workflow persona reads this to select and execute workflow chains.

## Priority Legend
- **P0:** Must test — core revenue/operational flows
- **P1:** Should test — secondary operational flows
- **P2:** Could test — edge operational flows

---

## P0 — Must Test

### W1: Lead → Quote → Win → Invoice → Payment → GL Journal

**Domains:** CRM → Finance → GL
**Roles:** sales → sales-manager → finance → (system)
**~45 test cases**

| # | Role | Action | Route | DB Table | Event |
|---|------|--------|-------|----------|-------|
| 1 | sales | Create lead | /ops/crm/leads/create | crm_lead | crm.lead.transitioned (created) |
| 2 | sales | Advance to L4 (qualified) | /ops/crm/leads/[code] | crm_lead | crm.lead.transitioned (level_changed) |
| 3 | sales | Create quote | /ops/crm/leads/[code] | crm_quote | crm.quote.created |
| 4 | sales-manager | Approve quote | /ops/crm/leads/[code] | crm_quote | crm.quote.accepted |
| 5 | sales | Mark won (L6) | /ops/crm/leads/[code] | crm_lead | crm.lead.transitioned (won) |
| 6 | finance | Verify invoice auto-created | /ops/billing/invoices/[id] | fin_invoice | fin.invoice.created |
| 7 | finance | Record payment | /ops/billing/invoices/[id] | fin_payment | fin.payment.received |
| 8 | (verify) | Check GL journal auto-posted | /ops/finance/journals | gl_journal_entry | — |
| 9 | (verify) | Check trial balance updated | /ops/finance/trial-balance | gl_account_balance | — |

**Cross-domain events to verify:** crm.lead.transitioned → fin.invoice.created → fin.payment.received → GL auto-journal

---

### W2: Lead → Enrollment → Attendance → Certification

**Domains:** CRM → LMS
**Roles:** sales → coordinator → trainer → student
**~50 test cases**

| # | Role | Action | Route | DB Table | Event |
|---|------|--------|-------|----------|-------|
| 1 | sales | Win lead (L6) | /ops/crm/leads/[code] | crm_lead | crm.lead.transitioned (won) |
| 2 | coordinator | Create class from course | /ops/classes/create | lms_class | lms.class.created |
| 3 | coordinator | Assign trainer | /ops/classes/[code] | lms_class_trainer | — |
| 4 | coordinator | Publish class | /ops/classes/[code] | lms_class | lms.class.confirmed |
| 5 | coordinator | Create enrollment | /ops/enrollments/create | lms_enrollment | lms.enrollment.activated |
| 6 | trainer | View class schedule | /trainer/classes | — | — |
| 7 | trainer | Mark attendance | /trainer/attendance | lms_attendance | lms.attendance.marked |
| 8 | (verify) | Check 70% completion threshold | DB query | lms_enrollment | — |
| 9 | coordinator | Issue certification | /ops/lms/certifications | lms_certification | lms.certification.issued |
| 10 | student | View certificate | /learner/certificates | — | — |
| 11 | (verify) | Public cert verification | /chung-nhan/[code] | — | — |

**Cross-domain events to verify:** crm.lead.transitioned → lms.enrollment.activated → lms.attendance.marked → lms.certification.issued

---

### W3: User Registration → RBAC Assignment → Permission Check

**Domains:** Infra
**Roles:** (guest) → admin → (new user)
**~40 test cases**

| # | Role | Action | Route | DB Table | Event |
|---|------|--------|-------|----------|-------|
| 1 | guest | Register new user | /register | user | inf.user.created |
| 2 | admin | View user list | /ops/admin/users | — | — |
| 3 | admin | Assign role to new user | /ops/admin/users/[id] | md_user_role | inf.role.assigned |
| 4 | (verify) | Casbin rules synced | DB: casbin_rule | casbin_rule | — |
| 5 | new user | Login | /login | session | — |
| 6 | new user | Access permitted route | /ops/{allowed} | — | — |
| 7 | new user | Denied on forbidden route | /ops/{forbidden} | — | — |
| 8 | admin | Revoke role | /ops/admin/users/[id] | md_user_role | inf.role.revoked |
| 9 | new user | Re-login → verify denial | /ops/{previously-allowed} | — | — |

**4-layer RBAC verification:** UI buttons (L1) → permissionProcedure (L2) → data scope (L3) → tenant isolation (L4)

---

### W9: Master Data Seed → CRUD → Casbin Sync

**Domains:** Infra
**Roles:** admin
**~20 test cases**

| # | Role | Action | Route | DB Table | Event |
|---|------|--------|-------|----------|-------|
| 1 | admin | View seeded choices | /ops/settings/choices | md_choice | — |
| 2 | admin | Create custom choice | /ops/settings/choices | md_choice | — |
| 3 | admin | Verify system choice read-only | /ops/settings/choices | — | — |
| 4 | admin | Create custom role | /ops/admin/roles | md_role | — |
| 5 | admin | Assign permissions to role | /ops/admin/roles/[id] | md_role_permission | — |
| 6 | (verify) | Casbin sync complete | DB: casbin_rule | casbin_rule | — |

---

## P1 — Should Test

### W4: Course → Class → Session → Trainer Payment
**Domains:** LMS → Finance | **Roles:** coordinator → trainer → finance
**Steps:** Create course → Create class → Generate sessions → Assign trainer → Attendance → Import hours → PIT calculation

### W5: Campaign → Nurture → Lead Capture → Email Delivery
**Domains:** CRM + CMS + COM | **Roles:** admin → sales
**Steps:** Create campaign → Define nurture → Website form → Lead captured → Nurture triggered → Email sent → Track open/click

### W6: Support Ticket → Assignment → SLA → Resolution
**Domains:** SUP | **Roles:** support → coordinator → admin
**Steps:** Create ticket → Auto-assign → SLA timer → Respond → Resolve → Auto-close

### W7: Invoice → Payment → Dunning → Credit Note
**Domains:** Finance | **Roles:** finance → student
**Steps:** Invoice issued → Payment via VietQR → Reconcile → Installment plan → Dunning → Credit note

---

## P2 — Could Test

### W8: Learning Path → Multi-Course → Completion → Showcase
**Domains:** LMS + CMS | **Roles:** coordinator → student
**Steps:** Create learning path → Add courses → Student enrolls → Complete courses → Cert → Enable showcase

### W10: B2B Order → Corporate Contact → Acceptance → Dunning
**Domains:** Finance + CRM | **Roles:** sales-manager → corporate-contact → finance
**Steps:** Create order → Billing request → Acceptance workflow → Invoice → Dunning

---

## Shared Patterns

### Role Switching
```
1. Close current browser: agent-browser close
2. Open fresh: agent-browser open {ops_url}
3. Login as next role via UI (Navigate-First)
4. State save: agent-browser state save {run}/state/{role}.json
```

### Event Verification
After each domain-crossing step:
```bash
psql "$DATABASE_URL" -tA -c \
  "SELECT id, event_type, created_at FROM inf_event_outbox \
   WHERE event_type = \$1 ORDER BY created_at DESC LIMIT 1" \
  -v "1='{expected_event}'"
```
Save to: `evidence/db-checks/workflow/{W-id}/step-{N}-event.json`

### DB State Chain
Each step's output = next step's precondition. Verify the chain:
- Step N creates record → query to get its code/id
- Step N+1 uses that code/id to continue the flow
