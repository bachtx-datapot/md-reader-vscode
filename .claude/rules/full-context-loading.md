# Full Context Loading — Mandatory Before Code Modification

## Tier System

### Tier 1 — Structural Change
**Scope:** new feature, refactor, schema change, new module, new entity

**MANDATORY reads:**
- Original plan/spec (phase file or user story)
- ALL related module files (schema + service + router + events + types)
- ALL test files for the module
- Relevant pattern(s) from `.claude/patterns/`
- Tech design docs (04/05) via trigger table

**Objective:** Understand WHY code exists before changing HOW.

**BANNED pattern:** `grep → find function → edit → done` — this is a lazy fix that causes regressions.

### Tier 2 — Behavioral Change
**Scope:** bug fix, logic change, validation update, error handling

**MANDATORY reads:**
- Affected file + directly related files (e.g., service + its router + its tests)
- Relevant pattern from `.claude/patterns/`
- Related test file (to understand expected behavior)

**Objective:** Understand the INTENT of existing behavior before modifying.

### Tier 3 — Cosmetic/Type Fix
**Scope:** typo, type error, missing attribute, label change, import fix

**MANDATORY reads:**
- Affected file only

**Objective:** Quick targeted fix — no penalty.

## How to Determine Tier

| Signal | Tier |
|--------|------|
| Adding new table/entity | 1 |
| Adding new router/service | 1 |
| Adding new UI page/component | 1 |
| Refactoring module structure | 1 |
| Fixing wrong business logic | 2 |
| Fixing validation rules | 2 |
| Fixing query results | 2 |
| Adding error handling | 2 |
| Fixing TypeScript type error | 3 |
| Fixing typo in label | 3 |
| Fixing import path | 3 |
| Adding missing attribute | 3 |

## Lazy Fix Penalty

**Applies to Tier 1 and Tier 2 ONLY.**

Code reviewer deducts **-2 points** from overall review score when:
- Developer made Tier 1/2 change without loading full module context
- Evidence: only read 1-2 files for a multi-file behavioral change
- Pattern: narrow grep → single-file edit → submit

**No penalty for Tier 3** — quick fixes are expected and encouraged.

## Evidence of Context Loading

After implementing a Tier 1/2 change, include in completion report:

```markdown
### Context Loaded
- Plan/spec: {file path or "N/A for Tier 2"}
- Module files read: {list of files}
- Patterns consulted: {list of patterns}
- Specs consulted: {04/05 doc paths}
- Understanding: {1-2 sentence summary of WHY this code exists}
```

This is a summary of understanding — not just a file list.
