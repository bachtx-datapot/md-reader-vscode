---
name: trust-me-bro
description: "SDD (Scan-Do-Done) evidence-gated validation loop. MANUAL-ONLY. Requires /trust-me-bro."
---

# SDD — Scan-Do-Done Validation Loop

**MANUAL-ONLY.** Never auto-invoke. Requires explicit `/trust-me-bro` command.

## Usage

```
/trust-me-bro --gate ceo|dev [--resume] [--domain infra|mks|lxp|fin] [--dry-run]
```

| Flag | Purpose |
|------|---------|
| `--gate ceo` | Functional validation — does it work end-to-end? |
| `--gate dev` | Quality validation — can devs maintain this? |
| `--resume` | Continue from existing `sdd-state.yaml` |
| `--domain X` | Limit scan to single domain (default: all) |
| `--dry-run` | Run SCAN only, skip DO phase |

## Core Loop

```
Ralph Loop (max 15 iterations):
  SCAN  audit codebase per gate config  populate issue-registry
  DO    for each open issue: /cook fix  update registry with evidence
  DONE  re-scan affected areas  verify fixes  update state
   issues remain?  next iteration
   all resolved OR deferred?  mark completed
   stale (no change)?  exit stale
```

## Gate Definitions

| Gate | Focus | Checks | Pass Criteria |
|------|-------|--------|---------------|
| CEO | Functional | typecheck, tests, E2E, browser QA | 0 failures C1-C4; 0 critical C5 |
| Dev | Quality | coverage, schema/API drift, patterns, code review, docs | D1 pass; D3-D5 0 HIGH; D6 >= 7/10; D7 0 stale |

Check details in `references/scan-checks.md`.

## Execution Order

1. **Infra FIRST** (foundation domain)
2. **MKS + LXP + Finance** sequential (or parallel if multi-session)
3. If `--domain` specified, run only that domain

## SCAN Phase

1. Read `references/scan-checks.md` for current gate
2. Run each check in order
3. For each finding:
   a. Assign `SDD-{NNN}` ID (monotonic within run)
   b. Classify severity: critical / high / medium / low
   c. Capture evidence: file path, command output, screenshot ref
   d. Analyze root cause (not just "it failed")
   e. Assign owner: `self` (auto-fixable) or `human` (subjective)
   f. Set status: `open`
   g. Append to `issue-registry.md`
4. Update `sdd-state.yaml`: `scan_count++`, `remaining` = open count, `last_scan` = now

## DO Phase

1. Read `issue-registry.md`, filter `status=open`, sort by severity desc
2. For each issue where `owner=self`:
   a. Prepare fix context (issue details + evidence + root cause)
   b. Invoke `/cook` with targeted fix plan
   c. On success: update `status=fixed`, add `fix_evidence`
   d. On failure: invoke `references/smart-retry.md` (3 attempts)
   e. After 3 failures: invoke `references/circuit-breaker.md`, set `status=deferred` + `handoff_note`
3. For each issue where `owner=human`:
   a. Set `status=awaiting_human`
   b. Add `handoff_note` explaining what needs human judgment
4. Update state: `fix_count`, `defer_count`
5. If any `awaiting_human`: set `overall_status=awaiting_human`, exit cleanly

If `--dry-run`: skip DO phase entirely after SCAN.

## DONE Phase

1. Re-run SCAN checks that had findings (targeted, not full re-scan)
2. For each previously-fixed issue:
   a. Still failing: reopen (`status=open`), increment retry counter
   b. Passing: confirm `status=fixed`, add `verification_evidence`
3. Count `remaining` = open issues
4. If `remaining == 0`:
   a. Generate gate summary from `templates/gate-summary.md`
   b. Copy curated artifacts to `plans/handoff/`
   c. Set `overall_status=completed`, `overall_verdict=pass` or `pass_with_debt`
5. If `remaining > 0`: next iteration (ralph-loop handles)

## State Management

State file: `quality-reports/sdd-{run-id}/sdd-state.yaml`
Template: `templates/sdd-state.yaml`

On `--resume`: read existing state, continue from last phase.
On fresh start: copy template, set `run_id`, `gate`, `domain`.

## Issue Registry

**THE source of truth.** Every finding MUST populate all fields.

| Field | Required | Description |
|-------|----------|-------------|
| ID | yes | `SDD-{NNN}` monotonic |
| Severity | yes | critical / high / medium / low |
| Check | yes | Which scan check found it |
| Description | yes | What's wrong |
| Evidence | yes | File path, command output, screenshot ref |
| Root Cause | yes | Why it's wrong (analysis, not just "failed") |
| Owner | yes | `self` or `human` |
| Status | yes | `open` / `fixed` / `deferred` / `awaiting_human` |
| Fix Evidence | on fix | Proof the fix works |
| Handoff Note | on defer | Why it's OK to ship / what human should do |

**Rule:** Loop continues until every row has `status != open`.
**Rule:** "Deferred" acceptable with handoff_note. "Unexamined" is NOT.

Template: `templates/issue-registry.md`

## Autonomy Model

| Check type | Owner | Behavior |
|------------|-------|----------|
| Automated (typecheck, tests, grep) | self | Auto-proceed through DO |
| Subjective (browser QA, code review) | human | Set `awaiting_human`, exit cleanly |

Ralph-loop detects `awaiting_human` status — exits cleanly, human re-launches with `--resume`.

## Artifact Storage

```
quality-reports/sdd-{run-id}/          # gitignored
  sdd-state.yaml
  issue-registry.md                    # working copy
  evidence/
    scan-{N}/                          # per-iteration raw output
    screenshots/                       # browser QA evidence

plans/handoff/                         # git-tracked
  issue-registry.md                    # curated final copy
  ceo-gate-summary.md                 # gate 1 result
  dev-gate-summary.md                 # gate 2 result
  known-debt.md                       # deferred items + justification
```

Templates: `templates/gate-summary.md`, `templates/known-debt.md`

## Ralph Loop Integration

```bash
# CEO gate
.claude/scripts/ralph-loop.sh '/trust-me-bro --gate ceo --resume' 15 \
  quality-reports/sdd-{run-id}/sdd-state.yaml

# Dev gate (after CEO passes)
.claude/scripts/ralph-loop.sh '/trust-me-bro --gate dev --resume' 15 \
  quality-reports/sdd-{run-id}/sdd-state.yaml
```

## Reference Files

| File | Purpose | Used In |
|------|---------|---------|
| `references/scan-checks.md` | Per-gate check configuration | SCAN |
| `references/schema-alignment-check.md` | Schema vs 04-spec drift | SCAN (dev gate) |
| `references/api-alignment-check.md` | Router vs 05-spec drift | SCAN (dev gate) |
| `references/pattern-conformance-check.md` | Convention violations | SCAN (dev gate) |
| `references/evidence-package.md` | Per-iteration evidence format | DONE |
| `references/smart-retry.md` | 3-attempt escalating fix | DO |
| `references/circuit-breaker.md` | Max-fail handoff | DO |
| `references/sprint-summary-template.md` | Data source mapping for summaries | DONE |

## Critical Rules

1. Issue registry is the persistence layer — not PROGRESS.md, not decision-log.md
2. Every finding needs ID + evidence + root_cause + owner + status before loop exits
3. "Deferred" is acceptable with justification. "Unexamined" is NOT acceptable.
4. DO phase always uses `/cook` — no raw edits
5. Infra domain scanned first (foundation)
6. CEO gate must pass before dev gate starts
7. `overall_status` and `overall_verdict` must be single YAML tokens (ralph-loop parses them)
8. Raw artifacts in `quality-reports/` (gitignored). Curated in `plans/handoff/` (tracked).
