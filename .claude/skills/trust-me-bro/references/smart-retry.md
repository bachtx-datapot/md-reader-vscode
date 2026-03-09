# Smart Retry Protocol — Fail with Thinking

Replaces dumb 3x `/fix` loops. Each retry attempt escalates intelligence: quick fix → deep research + debate → full re-plan. The same retry without changing approach is a dead end.

```
Failure detected
    ↓
Classify error type
    ↓
Attempt 1: Quick fix (Type A/B only)
    ↓ still failing
Attempt 2: Brainstorm + Research in parallel → synthesize → re-approach
    ↓ still failing
Attempt 3: Full re-plan with failure context → /cook fresh section
    ↓ still failing
Circuit breaker → handoff with all findings
```

---

## 1. Error Classification

Classify BEFORE any retry action. Error type determines retry strategy.

| Type | Pattern | Retry Strategy |
|------|---------|---------------|
| **A — Syntax/Compile** | TypeScript error, import missing, type mismatch | Attempt 1: `/fix` (usually mechanical) |
| **B — Test Logic** | Test expectation wrong, assertion mismatch, mock incorrect | Attempt 1: `/fix`, then rethink test spec |
| **C — Integration** | DB connection, migration conflict, tRPC call fails at runtime | Attempt 2: brainstorm + research required |
| **D — Design Mismatch** | Wrong table/schema, API contract broken, business rule violated | Attempt 2: brainstorm + re-plan section |
| **E — External** | Redis unavailable, env missing, dependency version conflict | Diagnose infra first, then fix |
| **F — Unknown** | Vague error, stack trace not pointing to domain code | Attempt 2: debugger + brainstorm |

**Classification heuristics:**
- Error in `.ts` file during compile → Type A
- `expect(X).toBe(Y)` or `AssertionError` → Type B
- `Connection refused`, `relation does not exist`, `Cannot read properties of undefined` → Type C
- `cannot find column`, `procedure not found`, schema mismatch in test → Type D
- `ECONNREFUSED 127.0.0.1:6379`, missing env var → Type E
- Everything else → Type F (treat as C)

---

## 2. Attempt 1 — Quick Fix (Type A/B)

For Type A or B errors only:

```
Skill(skill: "fix", args: "--auto {error_description}")
→ Skill(skill: "test")
```

If pass → done.
If fail, or if error was Type C/D/E/F → skip to Attempt 2.

Log to issue-registry (update the issue's handoff_note):
```
SDD-{NNN}: Attempt 1 fix — Type {X} error
- Error: {summary}
- Fix applied: {what /fix did}
- Result: failed → escalating to Attempt 2
```

---

## 3. Attempt 2 — Brainstorm + Research (ALL Types after Attempt 1 fails)

**Core principle: same approach + same context = same failure. Change the approach.**

Spawn brainstorm AND research agents in parallel. Both receive full failure context.

### 3a. Prepare Failure Context

Build a context document `quality-reports/sdd-{run-id}/research/retry-context-{issue-id}-A2.md`:

```markdown
# Retry Context — {issue_id}: {description} — Attempt 2

## Failure Summary
- Error type: {A|B|C|D|E|F}
- Error message: {exact error}
- Stack trace: {relevant lines}
- File(s) failing: {paths}
- Issue registry entry: SDD-{NNN}

## What Was Attempted
- Original issue: {description from issue-registry}
- Fix in Attempt 1: {what /fix tried}
- Why it still failed: {analysis}

## Relevant Code
{paste the failing file(s) — relevant sections only, ≤50 lines each}

## Issue Context
- Domain: {domain}
- Check that found it: {check ID}
- Tables/procedures/events involved: {list}
- Project constraints: no pgEnum, singular tables, emitOutboxEvent, ≤200 lines
```

### 3b-0. Idempotency Check (MANDATORY before spawning)

<!-- Red Team M2: Resume re-enters Attempt 2 and spawns duplicate agents, discarding previous work -->

Check if previous session already ran Attempt 2 for this issue:
```
If quality-reports/sdd-{run-id}/research/brainstorm-{issue-id}-A2.md EXISTS
AND quality-reports/sdd-{run-id}/research/research-{issue-id}-A2.md EXISTS:
  → Skip spawn. Use existing reports. Go directly to Section 3c.
  Log: "Reusing Attempt 2 reports from previous session for {issue-id}"
```

Only spawn if BOTH files are missing.

### 3b. Parallel Spawn

<!-- Red Team M2: max_turns: 90 prevents parent session from hanging on subagent timeout -->

```
Task(subagent_type="brainstormer", run_in_background=True, max_turns=90,
  description="Debate approaches for {issue-id} failure",
  prompt="
  Analyze issue {issue-id} failure and debate the best approach to fix it.
  Be brutally honest — if the original design was wrong, say so.

  {paste retry-context content}

  Produce:
  1. Root cause diagnosis (why did the original approach fail?)
  2. 2-3 alternative approaches with trade-offs
  3. Recommended approach with confidence %
  4. Specific implementation steps for the recommended approach
  5. What to watch out for (anti-patterns to avoid)

  Save to: quality-reports/sdd-{run-id}/research/brainstorm-{issue-id}-A2.md
  Work context: /srv/datapot-operations-platform-v2
")

Task(subagent_type="researcher", run_in_background=True, max_turns=90,
  description="Research solution for {issue-id} failure pattern",
  prompt="
  Research best practices and concrete solutions for: {error_type_description}

  Context: TypeScript + tRPC + Drizzle ORM + PostgreSQL + Node.js

  {paste error message and relevant code from retry-context}

  Research:
  1. Official docs / GitHub issues for this exact error pattern
  2. Common root causes and solutions
  3. Concrete code examples that solve this pattern
  4. Pitfalls to avoid

  Save to: quality-reports/sdd-{run-id}/research/research-{issue-id}-A2.md
  Work context: /srv/datapot-operations-platform-v2
")
```

Wait for both to complete.

### 3c. Synthesize Findings

Read both reports. Determine:
1. Do they agree on root cause? → high confidence, proceed
2. Do they disagree? → pick the approach with stronger evidence (code examples > theory)
3. Does the recommended approach require re-planning the fix? → yes → update issue context

**Update issue-registry** with new approach context in the handoff_note column.

Log to issue-registry handoff_note:
```
Attempt 2 re-approach for {issue-id}
- Root cause: {diagnosis}
- New approach: {what changed}
- Source: brainstorm ({confidence}%) / research ({key finding})
- Trade-offs: {what was sacrificed}
```

### 3d. Execute New Approach

```
Skill(skill: "cook", args: "quality-reports/sdd-{run-id}/plans/{issue-id}-fix.md --auto")
→ Skill(skill: "test")
```

If pass → done.
If fail → Attempt 3.

---

## 4. Attempt 3 — Full Re-plan + Targeted Cook

**Last autonomous attempt before human handoff.**

### 4a. Full Re-plan

Discard the failing approach. Re-plan the entire fix from scratch with failure context injected.

```
Skill(skill: "plan", args: "--hard --no-tasks")
```

Context injection for the re-plan:

```
## Retry Context (CRITICAL — read before planning)
This issue has failed 2 previous attempts. Do NOT repeat the same approach.

Attempt 1 failure: {error_summary}
Attempt 2 failure: {error_summary}
Brainstorm finding: {paste brainstorm-{issue-id}-A2.md summary}
Research finding: {paste research-{issue-id}-A2.md summary}

The new plan MUST use the recommended approach from brainstorm.
Flag any remaining risks explicitly in ## Risk Assessment.
```

Save re-plan to: `quality-reports/sdd-{run-id}/plans/{issue-id}-retry3.md`

### 4b. Execute Re-plan

```
Skill(skill: "cook", args: "quality-reports/sdd-{run-id}/plans/{issue-id}-retry3.md --auto")
→ Skill(skill: "test")
```

If pass → done.
If fail → trigger circuit breaker with full retry history.

---

## 5. Circuit Breaker Trigger

After 3 attempts all fail, call circuit breaker (`references/circuit-breaker.md`) with enhanced context.

Update issue-registry: set `status=deferred`, populate handoff_note with:

```markdown
## Smart Retry History

### Attempt 1 — Quick Fix
- Error type: {A|B|C|D|E|F}
- Fix tried: {description}
- Result: {error}

### Attempt 2 — Brainstorm + Research
- Brainstorm report: quality-reports/sdd-{run-id}/research/brainstorm-{issue-id}-A2.md
- Research report: quality-reports/sdd-{run-id}/research/research-{issue-id}-A2.md
- Recommended approach: {summary}
- Result: {error}

### Attempt 3 — Full Re-plan
- Re-plan file: quality-reports/sdd-{run-id}/plans/{issue-id}-retry3.md
- What changed: {summary}
- Result: {final error}

## Hypothesis for Human Developer
{agent's best guess at root cause after 3 attempts + research}
Confidence: {%}
Recommended next step: {specific action}
```

---

## 6. Special Cases

### Type E (External/Infra) — Handle Before Retry

Before ANY retry attempt:
1. Diagnose: `psql $DATABASE_URL -c "SELECT 1"`, `redis-cli ping`, `pnpm tsc --noEmit`
2. If infra is down → STOP, do not retry. Log: "Blocked by infrastructure: {detail}"
3. Fix infra → re-run SCAN phase

### Flaky Tests — Distinguish from Real Failures

If test fails intermittently (passes on manual re-run):
1. Run 3x: `pnpm test {failing_test_file}`
2. If 2+/3 pass → flaky test (not a real issue). Log as `deferred` with justification "flaky test", continue
3. If 0/3 pass → real failure, enter smart retry

### Partial Success

If /cook partially succeeded (some fixes done, one failed):
- Do NOT re-run all fixes
- Resume from the failing issue only
- Smart retry applies only to the failing issue's code
