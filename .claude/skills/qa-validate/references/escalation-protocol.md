# Escalation Protocol — 3-Level Fix Engine

## Trigger
Any test case in test-backlog.yaml with status=fail.

## Level 1: Direct Fix

1. Classify failure:
   - **BUG** (existing code broken) → invoke `/fix` skill
   - **MISSING** (feature not built) → invoke `/cook` skill
   - **DESIGN** (UX/UI issue) → log as proposal, skip fix
2. **Scope constraint (RT-8):** L1 MUST NOT modify:
   - Auth procedures, RBAC configs, middleware
   - `permissionProcedure` definitions
   - Tenant isolation logic (`ensureTenant`)
   - If fix requires auth/RBAC changes → escalate to Level 2
3. Pass context to skill:
   - Error screenshot path
   - `agent-browser errors` output
   - `agent-browser snapshot -i` (compact page state)
   - DB state (psql query result)
   - Step description from test-backlog.yaml
4. After fix completes: **RETEST from login** (full flow, not just fixed step)
5. If retest PASSES:
   - **Git commit:** `fix(qa): {TC-ID} {description}` (V-5)
   - Mark TC as pass in test-backlog.yaml
   - Update validation-state.yaml: `fix_in_progress: null`
   - Continue to next TC
6. If retest FAILS → escalate to Level 2

## Level 2: Brainstorm + Multi-Agent Debate

**CRITICAL (RT-9):** L2 MUST spawn as a subagent to prevent context window exhaustion.

1. Spawn subagent (Agent tool) with context:
   - Original failure context (screenshot, error, DB state)
   - Level 1 fix attempt summary + why it failed
   - Related source file paths (not full content)
2. Subagent workflow:
   - Invoke `/brainstorm` → produces revised approach
   - Invoke `/plan` with brainstorm output (fast mode)
   - Invoke `/cook` with plan
3. Subagent exits → returns result summary to main session
4. Main session: **RETEST from login** (full flow)
5. If PASSES:
   - **Git commit:** `fix(qa): {TC-ID} {description}` (V-5)
   - Mark TC as pass, continue
6. If FAILS → escalate to Level 3

**Scope (V-4):** L2 CAN modify auth/RBAC — multi-agent debate may identify safe changes.
If auth change made → flag prominently in `proposals/human-handoff.md`.

## Level 3: Skip + Human Handoff

1. Mark test case `status: skipped` in test-backlog.yaml
2. Write journal entry (via `/journal` skill):
   - What was tried (L1 + L2 attempts)
   - Why it failed (root cause hypothesis)
   - Evidence links (screenshots, logs)
3. Add to `proposals/human-handoff.md`:
   - TC ID, title, severity
   - Attempted fixes summary
   - Recommended human action
4. Update validation-state.yaml: `fix_in_progress: null`
5. **CONTINUE remaining test cases** (do NOT abort run)
6. Executive summary flags skipped items

## State Management

During fix, validation-state.yaml shows:
```yaml
fix_in_progress:
  tc_id: TC-005
  level: 2
  delegated_to: brainstorm
  attempt: 1
total_fixes: 3  # incremented on each fix attempt
```

## Rules

- Each level uses a DIFFERENT strategy (no retry loops)
- Level 1 max: 1 attempt (targeted fix only)
- Level 2 max: 1 attempt (brainstorm + rethink)
- Level 3: immediate skip (no more attempts)
- Total max: 3 attempts per test case across all levels
- Never abort entire validation run for a single failure
- Atomic state writes: write to tmp file → `mv` to final path
