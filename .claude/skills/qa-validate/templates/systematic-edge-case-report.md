# Systematic Edge Case Report

**Process:** {process-name}
**Run ID:** {run-id}
**Date:** {date}
**Verdict:** {PASS | FAIL}

## Category 1: Input Validation

| # | Field | Input Type | Input Value | Expected | Actual | Verdict | Evidence |
|---|-------|-----------|-------------|----------|--------|---------|----------|
| 1 | {field} | empty | "" | Validation error | {actual} | PASS/FAIL | [screenshot](...) |
| 2 | {field} | max-length+1 | {value} | Rejected/truncated | {actual} | PASS/FAIL | [screenshot](...) |
| 3 | {field} | diacritics | Nguyễn Văn Ả | Stored correctly | {actual} | PASS/FAIL | [db-check](...) |
| 4 | {field} | xss | `<script>alert(1)</script>` | Escaped | {actual} | PASS/FAIL | [db-check](...) |
| 5 | {field} | sqli | `'; DROP TABLE --` | Safe handling | {actual} | PASS/FAIL | [db-check](...) |

## Category 2: Flow Interruption

| # | Scenario | Flow | Expected | Actual | Verdict | Evidence |
|---|----------|------|----------|--------|---------|----------|
| 1 | Back button mid-submit | {flow} | No orphan data | {actual} | PASS/FAIL | [screenshot](...) |
| 2 | F5 refresh mid-flow | {flow} | Form preserved or clean reset | {actual} | PASS/FAIL | [screenshot](...) |
| 3 | Double-click submit | {flow} | Single record created | {actual} | PASS/FAIL | [db-check](...) |
| 4 | Browser close + resume | {flow} | Session persists | {actual} | PASS/FAIL | [screenshot](...) |
| 5 | Slow network | {flow} | Timeout handled gracefully | {actual} | PASS/FAIL | [screenshot](...) |

## Category 3: State Edge Cases

| # | Scenario | Setup | Expected | Actual | Verdict | Evidence |
|---|----------|-------|----------|--------|---------|----------|
| 1 | Empty list | Delete all items | "No data" message | {actual} | PASS/FAIL | [screenshot](...) |
| 2 | Pagination boundary | Exactly page_size items | Correct page count | {actual} | PASS/FAIL | [screenshot](...) |
| 3 | Stale data submit | Modify via psql, submit form | Conflict detected | {actual} | PASS/FAIL | [screenshot](...) |

## DB Integrity After Edge Cases

| Check | Expected | Actual | Verdict |
|-------|----------|--------|---------|
| No XSS stored | 0 `<script>` rows | {actual} | PASS/FAIL |
| Vietnamese byte-accurate | Exact match | {actual} | PASS/FAIL |
| No orphan records | 0 orphans from interrupted flows | {actual} | PASS/FAIL |
| No duplicate submissions | 1 record per submit | {actual} | PASS/FAIL |

## Summary
- Input validation: {pass}/{total}
- Flow interruption: {pass}/{total}
- State edge cases: {pass}/{total}
- DB integrity: {pass}/{total}
- **Total: {pass}/{total}**
