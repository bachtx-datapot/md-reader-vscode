# Tech QA Report

**Process:** {process-name}
**Run ID:** {run-id}
**Date:** {date}
**Verdict:** {PASS | FAIL}

## Code Analysis Findings

| # | Severity | Type | Location | Description | Recommendation |
|---|----------|------|----------|-------------|----------------|
| 1 | {HIGH/MED/LOW} | {security/rbac/data/code} | {file:line} | {finding} | {fix} |

## RBAC Verification

| Endpoint | Auth Type | Expected | Actual | Verdict |
|----------|-----------|----------|--------|---------|
| {router.procedure} | permissionProcedure | {resource:action} | {actual} | PASS/FAIL |

## Tenant Isolation

| Check | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| ensureTenant middleware | Present | {actual} | PASS/FAIL |
| Service-layer filter | tenant_id in WHERE | {actual} | PASS/FAIL |
| Cross-tenant query | Empty/403 | {actual} | PASS/FAIL |

## DB Integrity

| Step | Table | Expected State | Actual State | Verdict |
|------|-------|----------------|--------------|---------|
| After create | {table} | Row with code={code} | {actual} | PASS/FAIL |

## Summary
- Code findings: {HIGH: N, MED: N, LOW: N}
- RBAC gaps: {count}
- Tenant isolation issues: {count}
- DB integrity failures: {count}
