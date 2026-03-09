# Persona Routing — Which Personas Per Flow

## Auto-Detection Rules

Read `docs/product/page-surface-registry.md` → determine route type:

| Route Type | Basic User | Tech QA | UX Designer | Visual | Workflow | Permission Matrix | Edge Case |
|------------|-----------|---------|-------------|--------|----------|-------------------|-----------|
| Customer-facing (website) | YES | YES | YES | YES | If multi-step | No | YES |
| Ops CRUD (forms/lists) | YES | YES | Optional | No | If multi-step | YES | YES |
| Admin settings | YES | YES | No | No | If multi-step | YES | Optional |
| API-only (no UI) | No | YES (code only) | No | No | No | No | No |

## Route Type Detection

- **Customer-facing:** routes under `apps/website/` or `localhost:3301`
- **Ops CRUD:** routes under `apps/ops/` with `/create`, `/edit`, `/[code]`, list pages
- **Admin settings:** routes containing `/settings/` or `/admin/`
- **API-only:** tRPC procedures without corresponding page in registry

## Override

User can specify personas explicitly:
```
/qa-validate "process" --personas basic,tech-qa
/qa-validate "process" --personas basic,tech-qa,ux,visual,workflow,permission,edge
```
Default: auto-detect from route type.

## Workflow Routing

Workflow persona activates when:
- Flow crosses 2+ module boundaries (e.g., CRM → Finance)
- Flow involves 2+ role switches
- Process matches a catalog workflow (W1-W10) in `references/workflow-definitions.md`

If none of these: workflow stage is SKIPPED.

## Permission Matrix Routing

Permission matrix persona activates for:
- ALL ops routes (not website)
- Requires all 12 role credentials in `.qa-config.yaml`
- Runs after workflow (needs validated routes first)

Can be invoked standalone: `--personas permission` for full grid verification.

## Edge Case Routing

Edge case persona activates for:
- Any flow with form inputs (input validation)
- Any multi-step flow (flow interruption)
- Any flow with list pages (state edge cases)

Skipped only for API-only routes (no browser interaction).

## Self-Completion Routing

| Flow Complexity | Max Edge Cases |
|----------------|---------------|
| Simple (1-3 inputs) | 5 |
| Medium (4-8 inputs) | 10 |
| Complex (9+ inputs or multi-step) | 20 |

Self-Completion always runs LAST after all other personas complete.
Generates proportional edge cases + proposals for gaps (unlike edge-case persona which is systematic).

## Stage Execution Order

```
Basic User ──────────────────→ Tech QA (browser) → UX Designer → Visual → Workflow → Permission Matrix → Edge Case → Self-Completion
Tech QA (code) ──── (parallel) ─┘
```

- Tech QA code analysis runs PARALLEL with Basic User (no browser conflict)
- Tech QA browser verification runs AFTER Basic User completes
- UX + Visual run sequentially after Tech QA browser
- Workflow runs after Visual (needs CRUD working first)
- Permission Matrix runs after Workflow (tests all roles against validated routes)
- Edge Case runs after Permission Matrix (systematic input/flow/state testing)
- Self-Completion runs LAST (proportional + proposal generation)
