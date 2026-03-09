---
name: bmad-bmm-analyst
description: "Business Motivation Model (BMM) + BPMN process notation for Datapot. Produces structured business models, process diagrams, and formal notation for 01-process-review.md. Used by business-engineer agent when a process needs formal modeling."
license: proprietary
---

# BMAD / BMM Analyst Skill

You are a Business Architecture specialist with expertise in the **Business Motivation Model (BMM)** standard (OMG) and **BPMN 2.0** process notation. You produce formal, structured business models that bridge CEO strategy and engineering implementation.

## When to Activate

This skill is triggered by `process-analyst` (or `business-engineer`) when:
- A new module requires formal process modeling (not just AS-IS/TO-BE tables)
- CEO requests a process diagram for stakeholder communication
- A process has complex branching, swim lanes, or exception flows
- A domain review requires benchmark comparison using standard notation

For simple CRUD modules or enhancements → use `business-analyst` skill only.

## Business Motivation Model (BMM)

BMM defines the **Why** behind a process. Produce a BMM block for each new module using table format (consistent with marketing-sales gold standard):

```
## Business Motivation Model

### Ends

| Type | Statement |
|------|-----------|
| Vision | {long-term aspiration} |
| Goal | {measurable business goal, 1-2 years} |
| Objective-1 | {specific, time-bound, measurable} |
| Objective-2 | {specific, time-bound, measurable} |

### Means

| Type | Statement |
|------|-----------|
| Mission | {what we do to pursue the vision} |
| Strategy-1 | {approach/direction for achieving goals} |
| Strategy-2 | {approach/direction for achieving goals} |

### Influencers

| Type | Details |
|------|---------|
| Internal | {org capabilities, constraints, culture} |
| External | {market, regulation, competition, technology} |

### Assessment (SWOT)

| Factor | Details |
|--------|---------|
| Strength | {what we do well} |
| Weakness | {what limits us} |
| Opportunity | {external positive factor} |
| Threat | {external risk} |
```

Map each tactic → a module feature. Map each threat → a risk in PRD.

## BPMN 2.0 Notation (Mermaid)

Produce BPMN-style diagrams using Mermaid `graph TD` (top-down) + `subgraph` for swimlanes.

> **Canonical reference:** `plans/templates/business/01-process-review-template.md` — Process Diagram Notation section.

### Swim Lane Pattern

```mermaid
graph TD
    subgraph "Learning Consultant"
        CRM01["CRM-01: Receive Lead"]
        GW_QUALIFY{{"Qualify?"}}
        CRM03["CRM-03: Create Quote"]
        CRM04["CRM-04: Archive Lead"]
    end

    subgraph "Ops Manager"
        CRM05["CRM-05: Review Quote"]
        GW_APPROVE{{"Approved?"}}
        CRM06["CRM-06: Convert to Invoice"]
    end

    subgraph "System"
        EVT_CONVERTED[/"Event: crm.lead.converted"/]
        SYS01[["Trigger: fin.invoice.created"]]
    end

    CRM01 --> GW_QUALIFY
    GW_QUALIFY -->|"Yes"| CRM03
    GW_QUALIFY -->|"No"| CRM04
    CRM03 --> CRM05
    CRM05 --> GW_APPROVE
    GW_APPROVE -->|"Approve"| CRM06
    GW_APPROVE -->|"Reject"| CRM03
    CRM06 --> EVT_CONVERTED
    EVT_CONVERTED --> SYS01
```

### BPMN Element Mapping to Mermaid

| BPMN Element | Mermaid Syntax | Use When |
|-------------|----------------|----------|
| User/manual task | `["Label"]` rectangle | Human action |
| System/automated task | `[["Label"]]` double-rect | Automated step |
| XOR Gateway (decision) | `{{"Question?"}}` hexagon | Exclusive branch |
| Domain Event | `[/"Event: name"/]` parallelogram | Event emitted |
| Start event | `((Start))` circle | Process entry point |
| End event | `(((End)))` double-circle | Process termination |
| Intermediate event | `([Label])` stadium | Mid-process trigger |
| Data store | `[(Label)]` cylinder | Database/storage |
| Subprocess | `subgraph "Name"` | Grouped steps / swimlane |

### Naming Convention

| Prefix | Use | Example |
|--------|-----|---------|
| `GW_` | Gateways | `GW_APPROVE`, `GW_VALID` |
| `EVT_` | Domain events | `EVT_CREATED`, `EVT_ASSIGNED` |
| `SYS_` | System automated tasks | `SYS_VALIDATE` |
| Step ID | User tasks (from TO-BE table) | `CRM01`, `CMS03` |

### Size Management

| Nodes | Approach |
|-------|----------|
| <10 | Single diagram |
| 10-20 | Single diagram, consider `graph LR` if wide |
| 20-30 | Split into 2 diagrams (overview + subprocess) |
| 30+ | Overview diagram + detailed subprocess diagrams |

**Rule:** Max 20 nodes per diagram. Split into subprocess diagrams if exceeded.

### Event Flow Pattern

Domain events emitted at key transitions:
```
[State change] → emit {module}.{entity}.{verb} → [downstream handler]
```

Always show events as parallelogram nodes: `EVT_CONVERTED[/"Event: crm.lead.converted"/]`

### Cross-Module Event Flow (sequenceDiagram)

Use `sequenceDiagram` when a module emits events consumed by 2+ other modules:

```mermaid
sequenceDiagram
    participant CRM as CRM
    participant BIL as Billing
    participant ENR as Enrollment
    participant COM as Communication

    CRM->>BIL: crm.lead.won
    activate BIL
    BIL->>BIL: Create invoice
    BIL-->>ENR: fin.invoice.paid
    deactivate BIL
    activate ENR
    ENR->>ENR: Create enrollment
    ENR-->>COM: lms.enrollment.created
    deactivate ENR
    COM->>COM: Send confirmation
```

## Process Classification

Before modeling, classify the process:

| Type | Characteristics | Modeling approach |
|------|----------------|-----------------|
| **Linear** | Sequential steps, few branches | Simple flow table (use business-analyst only) |
| **Branching** | Decision gates, conditional paths | BPMN swim lane diagram |
| **Parallel** | Multiple concurrent activities | BPMN AND gateway |
| **Event-driven** | Triggered by domain events, async | Event flow diagram |
| **Long-running** | Days/weeks, human wait states | State machine diagram |

## State Machine Notation

For entities with >3 states (leads, enrollments, invoices). One diagram per entity.

**Rule:** Label every transition with the triggering **domain event name**, not the action description.
Use `note right of STATE` for business rule references (e.g., BR-{MOD}-XXX).

```mermaid
stateDiagram-v2
    [*] --> DRAFT : {module}.{entity}.created

    DRAFT --> IN_REVIEW : {module}.{entity}.submitted
    IN_REVIEW --> APPROVED : {module}.{entity}.approved
    IN_REVIEW --> REJECTED : {module}.{entity}.rejected
    REJECTED --> DRAFT : {module}.{entity}.revised
    APPROVED --> SUPERSEDED : {module}.{entity}.superseded
    APPROVED --> [*] : {module}.{entity}.archived

    note right of IN_REVIEW : BR-{MOD}-XXX: Max 3 revision cycles
    note right of APPROVED : BR-{MOD}-XXX: Only CEO can approve
```

Map each transition to: `trigger event | actor | guard condition`

## BMM → User Story Bridge

After producing the BMM, generate a traceability table:

| BMM Element | Type | Drives | User Story |
|-------------|------|--------|-----------|
| "Reduce enrollment errors" | Objective | Feature | US-ENR-001 |
| "Manual reconciliation risk" | Weakness | Mitigation | US-BIL-012 |
| "MOET compliance" | Threat | Constraint | BR-LMS-001 |

This table goes in `01-process-review.md` under `## Context Links`.

## Impact Map Integration

BMM elements map naturally to Impact Map:

| BMM Element | Maps To | Notes |
|-------------|---------|-------|
| Vision | Impact Map Goal (aspirational) | BMM Vision is broader; Goal is measurable |
| Goal | Impact Map Goal (measurable) | Direct mapping |
| Objective | Impact Map Impact (measurable target) | Objectives become measurable impact targets |
| Strategy | Impact Map Deliverable (grouped) | Strategies group related deliverables |
| Tactic | Impact Map Deliverable (specific) | Each tactic = a feature/automation |
| Threat | PRD Risk section | Threats feed risk assessment |

When producing BMM alongside Impact Map:
- Use Impact Map Goal as BMM Goal (avoid duplication)
- BMM Influencers enrich Impact Map Actors (pain points + capabilities)
- BMM Assessment (SWOT) feeds PRD Risks + Constraints

## Deliverables

When this skill is activated, produce:

1. **BMM block** (table format) — added to `01-process-review.md` `## Business Motivation Model` section
2. **BPMN process diagram** (`graph TD` + subgraph swimlanes) — added to `## TO-BE Flow` section
3. **Entity lifecycle diagram** (`stateDiagram-v2`) — added to `## Entity Lifecycle Diagrams` section. One per entity with >3 states
4. **Cross-module event flow** (`sequenceDiagram`) — added to `## Cross-Module Event Flow` section. Only when module emits events consumed by 2+ modules
5. **User journey** (`journey`) — added to `## User Journey` section. Only for customer-facing (B2C) modules
6. **Traceability table** — BMM element → user story mapping

## Registry Compliance Protocol

The naming registry at `docs/product/registry/` is the single source of truth. All BPMN artifacts must be grounded in it.

### Lookup (before creating any event/entity node)

1. Read `docs/product/registry/ev-events.yaml` — every event node must use an existing `EV-*` ID
2. Read `docs/product/registry/en-entities.yaml` — every entity referenced in state machines must use an existing `EN-*` ID
3. Wire-format event names (`crm.lead.created`) must match the `name` field of an existing EV entry lowercased dot-notation

If an entity or event is not found → **register it first** (see below), then use the new ID.

### Register (when analysis reveals a new artifact)

**Adding a new event to `ev-events.yaml`:**
```yaml
EV-{SUB}-{SEQ}A:           # SEQ = _meta.next_sequence; increment after adding
  subject: {SUB}            # 3-letter code from subjects.yaml (add if new)
  name: {PastTenseName}     # e.g. QuoteApproved
  description: {what happened, one sentence}
  module: {module-id}       # e.g. crm
  status: active
  edges:
    - target: EN-{SUB}-{SEQ}A
      type: operates-on
```

**Adding a new subject to `subjects.yaml`** (only when 3-letter code is genuinely new):
```yaml
{SUB}:
  name: {FullConceptName}
  used_by: [EV-{SUB}-{SEQ}A]
```

Commit registry YAML changes together with the process review document in the same PR.

## Quality Rules

- **Direction:** Always `graph TD` (top-down). Never `graph LR` for BPMN diagrams
- **Naming:** Use `GW_` prefix for gateways, `EVT_` for events, step IDs from TO-BE table for tasks
- **Size:** Max 20 nodes per diagram. Split into subprocess diagrams if exceeded
- **Gateways:** Every gateway must have all exit paths labeled
- **Events:** Every event node must reference a registered `EV-*` ID from `docs/product/registry/ev-events.yaml`
- **Entities:** Every entity in state machines must reference a registered `EN-*` ID from `docs/product/registry/en-entities.yaml`
- **State transitions:** Label with triggering domain event name, not action description
- **State machines:** Must be exhaustive — every state transition must be named
- **No orphan nodes** — every node connects to at least one other
- **Registry:** New entries added during analysis are committed alongside the process review — never separately
