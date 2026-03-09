# Registry Sync Check — Code vs YAML Registries

Verifies modules, entities, and events in code match their YAML registry entries.

**When to run:** SDD SCAN phase (dev gate, check D8).
**Scope:** All implemented modules and their schema/service files.

## 1. D8a — Module Registry Sync

Compare directories on disk vs `docs/product/registry/modules.yaml`.

```bash
# Modules on disk
ls -d apps/ops/src/modules/*/ | xargs -I{} basename {} | sort > /tmp/sdd-modules-disk.txt

# Modules in registry (active only) — match lines with exactly 2-space indent + name + colon + EOL
# This excludes metadata fields (description:, last_updated:, etc.) which have values after the colon
grep -E '^ {2}[a-z][a-z0-9-]+:\s*$' docs/product/registry/modules.yaml | sed 's/^ *//;s/:.*//' | sort > /tmp/sdd-modules-yaml.txt
# Filter out consolidated modules
grep -B20 'status: consolidated' docs/product/registry/modules.yaml | grep -E '^ {2}[a-z][a-z0-9-]+:\s*$' | sed 's/^ *//;s/:.*//' | sort > /tmp/sdd-consolidated.txt
comm -23 /tmp/sdd-modules-yaml.txt /tmp/sdd-consolidated.txt > /tmp/sdd-modules-active.txt
mv /tmp/sdd-modules-active.txt /tmp/sdd-modules-yaml.txt

# Diff
comm -23 /tmp/sdd-modules-disk.txt /tmp/sdd-modules-yaml.txt  # on disk, not in YAML
comm -13 /tmp/sdd-modules-disk.txt /tmp/sdd-modules-yaml.txt  # in YAML, not on disk
```

| Finding | Severity |
|---------|----------|
| Module on disk NOT in registry | HIGH |
| Active module in registry NOT on disk | HIGH |
| Consolidated module still has directory | MEDIUM |

## 2. D8b — Entity Registry Sync

Compare `pgTable()` calls in schema files vs `docs/product/registry/en-entities.yaml`.

```bash
# Tables in code (extract table names from pgTable calls)
grep -rhoP "pgTable\('\K[^']+" apps/ops/src/modules/*/schema/*.ts 2>/dev/null | sort -u > /tmp/sdd-tables-code.txt

# Also check finance sub-modules
grep -rhoP "pgTable\('\K[^']+" apps/ops/src/modules/finance/*/schema/*.ts 2>/dev/null >> /tmp/sdd-tables-code.txt
sort -u -o /tmp/sdd-tables-code.txt /tmp/sdd-tables-code.txt

# Tables in entity registry
grep -oP 'table_name:\s*\K\S+' docs/product/registry/en-entities.yaml | sort -u > /tmp/sdd-tables-yaml.txt

# Diff
comm -23 /tmp/sdd-tables-code.txt /tmp/sdd-tables-yaml.txt  # in code, not registered
comm -13 /tmp/sdd-tables-code.txt /tmp/sdd-tables-yaml.txt  # registered, not in code
```

| Finding | Severity |
|---------|----------|
| Table in code NOT in entity registry | HIGH |
| Active entity in registry NOT in code | MEDIUM |

**Exceptions:** Better Auth tables (`user`, `session`, `account`, `verification`) are framework-managed — skip.

## 3. D8c — Event Registry Sync

Compare `eventType:` values in code vs `name:` field in `docs/product/registry/ev-events.yaml`.

**Note:** Code uses dotted event types (`crm.lead.transitioned`), registry uses PascalCase (`LeadTransitioned`).
Comparison is semantic — Claude maps between conventions. Direct `comm` diff won't work without normalization.

```bash
# Events emitted in code — extract eventType: 'xxx' values from all TS files
# Pattern: eventType: 'dotted.event.name' (in emitOutboxEvent/emitOutboxEventDirect call objects)
grep -rhoP "eventType:\s*['\"]\\K[^'\"]+\"" apps/ops/src/modules/ --include="*.ts" 2>/dev/null | \
  sed "s/['\"]$//" | sort -u > /tmp/sdd-events-code.txt

# Also check webhook routes (some events emitted from API route handlers)
grep -rhoP "eventType:\s*['\"]\\K[^'\"]+\"" apps/ops/src/app/api/ --include="*.ts" 2>/dev/null | \
  sed "s/['\"]$//" >> /tmp/sdd-events-code.txt
sort -u -o /tmp/sdd-events-code.txt /tmp/sdd-events-code.txt

# Events in registry (PascalCase names)
grep -oP '^\s+name:\s*\K\S+' docs/product/registry/ev-events.yaml | sort -u > /tmp/sdd-events-yaml.txt

# Manual comparison needed: code uses 'crm.lead.transitioned', registry uses 'LeadTransitioned'
# Claude should map: dotted.snake → PascalCase and compare coverage
# Unmatched code events = unregistered (HIGH)
# Unmatched registry events = possibly not implemented yet (MEDIUM)
```

| Finding | Severity |
|---------|----------|
| Event emitted in code NOT in registry | HIGH |
| Active event in registry NOT emitted anywhere | MEDIUM |
| Deprecated event still emitted in code | HIGH |

## 4. Output Format

For each finding, log to issue-registry:

```markdown
| SDD-{NNN} | {high|medium} | D8-registry | {domain}: {item} — {description} | grep output | {why it diverges} | self | open | — | — |
```

Summary:

```markdown
## Registry Sync Report

| Sub-check | Code Items | Registry Items | Unregistered | Missing Code | Status |
|-----------|-----------|---------------|-------------|-------------|--------|
| D8a modules | {N} | {N} | {N} | {N} | {PASS|FAIL} |
| D8b entities | {N} | {N} | {N} | {N} | {PASS|FAIL} |
| D8c events | {N} | {N} | {N} | {N} | {PASS|FAIL} |

Issues logged to registry: {N}
```
