# Permission Matrix Report

**Process:** {process-name}
**Run ID:** {run-id}
**Date:** {date}
**Verdict:** {PASS | FAIL}

## Matrix Summary

| Role | Routes Tested | Positive OK | Negative OK | Scope OK | Mutations Denied | Failures |
|------|--------------|-------------|-------------|----------|-----------------|----------|
| super-admin | {N} | {N} | {N} | N/A | N/A | {N} |
| admin | {N} | {N} | {N} | N/A | N/A | {N} |
| sales-manager | {N} | {N} | {N} | {N} | {N} | {N} |
| coordinator | {N} | {N} | {N} | {N} | {N} | {N} |
| finance | {N} | {N} | {N} | {N} | {N} | {N} |
| trainer | {N} | {N} | {N} | {N} | {N} | {N} |
| sales | {N} | {N} | {N} | {N} | {N} | {N} |
| support | {N} | {N} | {N} | {N} | {N} | {N} |
| student | {N} | {N} | {N} | {N} | {N} | {N} |
| corporate-contact | {N} | {N} | {N} | {N} | {N} | {N} |
| receptionist | {N} | {N} | {N} | {N} | {N} | {N} |
| other_tenant_user | {N} | N/A | {N} | N/A | N/A | {N} |

## Phase A: Positive Access Failures (should access but denied)

| # | Role | Route | Resource | Expected | Actual | Evidence |
|---|------|-------|----------|----------|--------|----------|

## Phase B: Negative Access Failures (should deny but allowed)

| # | Role | Route | Resource | Expected | Actual | Evidence |
|---|------|-------|----------|----------|--------|----------|

## Phase C: Mutation Denial Failures

| # | Role | Route | Resource:Action | Expected | Actual | Evidence |
|---|------|-------|----------------|----------|--------|----------|

## Phase D: Data Scope Violations

| # | Role | Resource | Expected Scope | Records Seen | Admin Records | Verdict |
|---|------|----------|---------------|-------------|---------------|---------|

## Phase E: Cross-Tenant Isolation

| Route Category | Routes Tested | Data Leaks | Verdict |
|----------------|--------------|------------|---------|
| CRM | {N} | {N} | PASS/FAIL |
| LMS | {N} | {N} | PASS/FAIL |
| Finance | {N} | {N} | PASS/FAIL |
| Admin | {N} | {N} | PASS/FAIL |

## Summary
- Roles tested: {N}/12
- Total cells tested: {N}
- Positive access: {pass}/{total}
- Negative access: {pass}/{total}
- Mutation denial: {pass}/{total}
- Data scope: {pass}/{total}
- Cross-tenant: {PASS|FAIL}
