# Permission Matrix Generation

How to build and verify the role x route permission grid.

**When to use:** Permission matrix persona reads this to build expected outcomes and test strategy.

## Data Sources

| Source | Provides | Path |
|--------|----------|------|
| Page Surface Registry | Route list (~250 routes) | `docs/product/page-surface-registry.md` |
| RBAC Registry | Role x resource matrix | `apps/ops/src/shared/rbac/rbac-registry.ts` |
| Role definitions | System role list (12 roles) | `apps/ops/src/shared/auth/roles.ts` |
| QA Config | Test credentials per role | `quality-reports/.qa-config.yaml` |

## Route → Resource Mapping

Map routes to RBAC resources for expected outcome lookup:

| Route Pattern | Resource | Action |
|---------------|----------|--------|
| `/ops/crm/leads` | crm:leads | read |
| `/ops/crm/leads/create` | crm:leads | write |
| `/ops/crm/leads/[code]` | crm:leads | read |
| `/ops/billing/invoices` | fin:invoices | read |
| `/ops/billing/invoices/new` | fin:invoices | write |
| `/ops/admin/users` | inf:users | read |
| `/ops/settings/choices` | md:choices | read |
| `/ops/support/tickets` | sup:tickets | read |
| `/ops/lms/*` | lms:{entity} | read/write |

**General pattern:** `/ops/{module}/{entity}/*` → `{prefix}:{entity}`
- List/detail pages → `read` action
- Create/edit pages → `write` action
- Delete buttons → `delete` action
- Approve buttons → `approve` action

## Expected Outcome Derivation

From RBAC Registry `defaultMatrix.{resource}.{role}`:
- **Present + has R** → ALLOW for list/detail routes
- **Present + has W** → ALLOW for create/edit routes
- **Absent** → DENY (expect 403 or redirect)
- **Scope = own** → list shows only user's records
- **Scope = team** → list shows team members' records
- **Scope = all** → list shows all records

## 12 System Roles

Ordered by privilege level:
1. super-admin (full access, all tenants)
2. admin (full access, own tenant)
3. sales-manager (CRM team scope)
4. coordinator (LMS all scope)
5. finance (Finance all scope)
6. trainer (own classes/attendance)
7. sales (own leads/quotes)
8. support (tickets all scope)
9. student (own enrollments/certs)
10. corporate-contact (own orders/invoices)
11. receptionist (attendance all scope)
12. other_tenant_user (different tenant — 0 data)

## 5 Test Phases

### Phase A: Positive Access
For each role, visit routes it SHOULD access. Expect page renders (no 403).
**Batch:** all routes per login session.

### Phase B: Negative Access
For each role, visit routes it should NOT access. Expect 403, redirect, or permission error.
**Focus:** admin-only routes visited by non-admin roles.

### Phase C: Mutation Denial
For each role, attempt mutations it lacks write access for.
**Method:** navigate to form → fill → submit → expect server-side denial from `permissionProcedure`.

### Phase D: Data Scope Verification
For roles with own/team scope:
1. Login as scoped role → list endpoint → count records
2. Login as admin → same list → count records
3. Assert: scoped count <= admin count
4. Verify: all IDs in scoped list match expected scope criteria

### Phase E: Cross-Tenant Isolation
Login as `other_tenant_user` → visit ALL ops routes → expect 0 data from primary tenant.
Any data visible = CRITICAL finding.

## Optimization

- **Batch by role:** one login session per role, test all applicable routes
- **Checkpoint every 10 routes:** update `permission_matrix_state.current_route_index`
- **Skip non-Done routes:** only test routes with status "Done" in page-surface-registry
- **Parallelize code analysis:** route→resource mapping can be pre-computed before browser testing
