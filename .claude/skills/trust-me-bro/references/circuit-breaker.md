# Circuit Breaker — Fail-Forward with Evidence

Fail-forward logic ensuring the agent never gets stuck on a single issue. 3-fail max per issue, then defer with full context.

## 1. Fail Counter Logic

Track per-issue failures via retry count in the DO phase.

**Important:** Retries are governed by `references/smart-retry.md` — NOT a dumb fix loop.
Each failure must go through smart retry (classify → fix → brainstorm+research → re-plan) before incrementing.

```
On /cook fix failure for an issue:
  1. Increment retry count for this issue (tracked in DO phase)

  If retry == 1:
    → Smart Retry Attempt 1 (quick fix — Type A/B only)
    → See references/smart-retry.md Section 2

  If retry == 2:
    → Smart Retry Attempt 2 (brainstorm + research → new approach)
    → See references/smart-retry.md Section 3

  If retry == 3:
    → Smart Retry Attempt 3 (full re-plan → /cook)
    → See references/smart-retry.md Section 4

  If retry > 3:
    → TRIGGER CIRCUIT BREAKER (Section 2 below)
```

## 2. Circuit Breaker Actions

When triggered (3 fails on same issue), execute ALL in order:

### 2a. Update Issue Registry

Set issue status to `deferred` in issue-registry.md. Populate handoff_note with full retry history from smart-retry.md Section 5.

### 2b. Add to Known Debt

Append entry to the known-debt working copy at `quality-reports/sdd-{run-id}/known-debt.md`:

```markdown
| SDD-{NNN} | {severity} | {description} | Circuit breaker: 3 fix attempts failed. See handoff_note in registry. | human | next sprint |
```

### 2c. Journal Entry

```
Skill(skill: "journal", args: "Issue SDD-{NNN} ({description}) deferred after 3 fix attempts.
Root cause: {last_error}.
Attempted fixes: 1) {attempt_1} 2) {attempt_2} 3) {attempt_3}.
Impact: {what remains broken}.")
```

### 2d. Update State

Update `sdd-state.yaml`:
- `defer_count++`
- `remaining--` (issue no longer open)

### 2e. Revert Broken Code If Needed

If the fix attempts left compile errors:

```bash
# Find files with compile errors
BROKEN_FILES="quality-reports/sdd-{run-id}/circuit-breaker-{issue-id}.txt"
pnpm tsc --noEmit 2>&1 | grep "error TS" | awk -F'(' '{print $1}' | sort -u > "${BROKEN_FILES}"

# Revert broken files (handoff notes document what was attempted)
while read f; do
  git checkout HEAD -- "$f" 2>/dev/null && echo "Reverted: $f"
done < "${BROKEN_FILES}"

# Verify compile passes before continuing
pnpm tsc --noEmit && echo "Clean compile — safe to continue"
```

If compile still fails after revert → git stash the changes.

Log: `Issue SDD-{NNN}: DEFERRED after 3 attempts. Broken files reverted. Continuing.`
Continue DO phase with next open issue.

## 3. Deferred Issue Re-evaluation on Resume

When resuming with `--resume`, check deferred issues:

| Deferred reason | Resume action |
|----------------|--------------|
| **Type E** (infra/external) | Re-check infra health. If healthy → reopen as `open`, reset retry count |
| **Type A/B** (compile/test) | Keep deferred — code issues don't self-heal |
| **Type C/D/F** (integration/design) | Keep deferred — design issues need human input |

**On Type E re-evaluation:**
- If infra healthy: set issue `status=open` in registry, remove from known-debt
- Log: "Reopened SDD-{NNN} after Type E infra re-check passed on resume"

## 4. Session-End Journal

At validation end OR on graceful exit, write session journal:

```
Skill(skill: "journal", args: "SDD validation session for {gate} gate.
Fixed: {fixed_count} issues.
Deferred: {deferred_count} issues.
Key learnings: {top_3_insights}.
Next: {what_remains}.")
```
