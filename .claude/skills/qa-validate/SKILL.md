# qa-validate — QA Lead Agent

## Metadata
name: qa-validate
description: "Autonomous QA validation with Navigate-First browser testing"
argument-hint: "<process-name> [--resume] [--personas basic,tech-qa,ux,visual,workflow,permission,edge]"
attribution: "Inspired by agentic-qe (MIT) by proffesor-for-testing — visual/security patterns merged into personas"

## Invocation
```
/qa-validate "Order new course as new customer"
/qa-validate --resume
/qa-validate "Manage leads" --personas basic,tech-qa
```

## Pre-Flight

1. Parse args: process name, `--resume` flag, `--personas` filter
2. Verify agent-browser: `which agent-browser || { echo "MISSING: agent-browser CLI"; exit 1; }`
3. Read credentials: `quality-reports/.qa-config.yaml` — **NEVER hardcode** (RT-3)
4. Verify dev server: `curl -sf {ops_url}` from config (default: `http://localhost:3201`)
5. Verify DB: `psql "$DATABASE_URL" -c "SELECT 1"` (RT-11)
6. If `--resume`: find most recent `quality-reports/*/validation-state.yaml`, jump to `current_stage`
7. If new run:
   - Generate run-id: `{YYMMDD}-{HHMM}-{process-slug}`
   - Create `quality-reports/{run-id}/` with `chmod 700`
   - Create subdirs: `evidence/screenshots/{basic-user,workflow,permission-matrix,edge-case}`, `evidence/videos/`, `evidence/db-checks/{workflow,permission-matrix,edge-case}`, `reports/`, `proposals/`
   - Read `docs/product/page-surface-registry.md` → extract relevant routes
   - Read user stories if available → extract acceptance criteria
   - Generate `test-backlog.yaml` from process description + registry
   - Initialize `validation-state.yaml` from template

## v0.6 Scope — All 9 Stages Active
All persona stages implemented. Permission matrix requires all 12 role credentials in `.qa-config.yaml`.
**App scope (V-7):** Ops app only (`localhost:3201`).

## Orchestration Loop

For each stage in `[basic_user, tech_qa_code, tech_qa_browser, ux_designer, visual_compliance, workflow, permission_matrix, edge_case, self_completion]`:

1. Check persona routing: load `references/persona-routing.md` → skip if not applicable
2. Load persona prompt from `prompts/{stage}.md`
3. Load references: `references/navigate-first-pattern.md`, `references/escalation-protocol.md`
4. Execute persona
5. On FAIL → invoke escalation protocol (`references/escalation-protocol.md`)
6. On fix success → **git commit**: `fix(qa): {TC-ID} {description}` (V-5)
7. Update `validation-state.yaml` (atomic: write tmp → mv)
8. If all stages PASS or SKIPPED → generate reports

## Resume Protocol (--resume)

When invoked with `--resume`:
1. Find most recent `validation-state.yaml` in `quality-reports/`
2. Read state:
   - `overall_status: completed` → report "Already complete" and exit
   - `current_stage` → resume from this stage
   - `current_tc` → resume from this test case
   - `fix_in_progress` → continue escalation at recorded level
3. Restore browser state: `agent-browser open {ops_url}` → `agent-browser state load {run}/state/auth.json`
4. Skip completed stages, resume in-progress stage from `current_tc`

When invoked WITHOUT `--resume`:
1. Create fresh run: `quality-reports/{run-id}/`
2. Initialize `validation-state.yaml` from template
3. Generate `test-backlog.yaml` from process description
4. Start from `basic_user` stage

## Post-Stages (Report Generation)

1. Load `references/report-generation.md`
2. Generate all reports from templates
3. Write git-tracked summary: `plans/reports/qa-{run-id}.md`
4. Update `validation-state.yaml`: `overall_status: completed`, `overall_verdict: {pass|fail|pass_with_proposals}`
5. **Auto-update Page Surface Registry (V-8):** update `Last Tested` column in `docs/product/page-surface-registry.md`

## Ralph Loop Usage

### Single interactive run
```
/qa-validate "Order new course as new customer"
```

### Overnight autonomous run
```bash
.claude/scripts/ralph-loop.sh '/qa-validate "Order new course" --resume' 15 \
  quality-reports/{run-id}/validation-state.yaml
```

### Resume after crash/context reset
```
/qa-validate --resume
```
