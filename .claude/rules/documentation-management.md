# Project Documentation Management

### Roadmap & Changelog Maintenance
- **Project Roadmap** (`./docs/project-roadmap.md`): Living document tracking project phases, milestones, and progress
- **Project Changelog** (`./docs/project-changelog.md`): Detailed record of all significant changes, features, and fixes
- **System Architecture** (`./docs/system-architecture.md`): High-level C4 overview, module boundaries, tech decisions
- **Code Standards** (`./docs/code-standards.md`): TypeScript conventions, naming rules, testing standards

### Automatic Updates Required
- **After Feature Implementation**: Update roadmap progress status and changelog entries
- **After Major Milestones**: Review and adjust roadmap phases, update success metrics
- **After Bug Fixes**: Document fixes in changelog with severity and impact
- **After Security Updates**: Record security improvements and version updates
- **Weekly Reviews**: Update progress percentages and milestone statuses

### Documentation Triggers
The `project-manager` agent MUST update these documents when:
- A development phase status changes (e.g., from "In Progress" to "Complete")
- Major features are implemented or released
- Significant bugs are resolved or security patches applied
- Project timeline or scope adjustments are made
- External dependencies or breaking changes occur

### Update Protocol
1. **Before Updates**: Always read current roadmap and changelog status
2. **During Updates**: Maintain version consistency and proper formatting
3. **After Updates**: Verify links, dates, and cross-references are accurate
4. **Quality Check**: Ensure updates align with actual implementation progress

### Artifact Naming & ID Conventions

All artifact IDs **MUST** follow → `docs/product/registry/README.md` (ID patterns, naming conventions, status enums, governance).

### Business Requirement Templates

All business requirement templates → `plans/templates/business/` (5 templates: impact-map, brief, process-review, user-stories, prd).

### Registry Context (for implementation agents)

When implementing new modules, entities, or events, consult:
- **Module registry:** `docs/product/registry/modules.yaml` — canonical module IDs, DB prefixes, paths
- **Entity registry:** `docs/product/registry/en-entities.yaml` — domain entities with typed IDs
- **Event registry:** `docs/product/registry/ev-events.yaml` — domain events with typed IDs
- **Subject codes:** `docs/product/registry/subjects.yaml` — 3-letter subject code ownership

### E2E Maintenance Protocol

**Rule:** When a route is added, renamed, or removed in `apps/ops/src/app/`, the following MUST be updated together:

1. **Page Surface Registry** (`docs/product/page-surface-registry.md`):
   - Add row to the relevant domain section
   - Set `E2E File` column to the spec file path (or `—` if not yet covered)
   - Set `Last Tested` to `—` until a test run confirms it

2. **E2E Spec File**:
   - Create or update the spec file under `tests/e2e/{domain}/{sub}/`
   - Add `@registry-route` JSDoc annotation matching the registry route
   - File naming: `{feature}.e2e.spec.ts`

3. **Playwright Config** (`apps/ops/playwright.config.ts`):
   - Confirm the new spec file's `testDir` is covered by an existing project
   - If a new domain: add `{domain}-desktop` + `{domain}-mobile` projects

4. **Run targeted E2E** after adding spec:
   ```bash
   pnpm playwright test --project={domain}-desktop {relative/path/to/spec.ts}
   ```
   Update `Last Tested` column in registry with today's date on pass.

**Enforcement:** The `docs-manager` agent MUST check the registry for stale `E2E File` entries (spec file missing on disk) when processing route changes. Flag mismatches as docs debt.

### Plans

### Plan Location
Save plans in `./plans` directory with timestamp and descriptive name.

**Format:** Use naming pattern from `## Naming` section injected by hooks.

**Example:** `plans/251101-1505-authentication-and-profile-implementation/`

#### File Organization

```
plans/
├── 20251101-1505-authentication-and-profile-implementation/
    ├── research/
    │   ├── researcher-XX-report.md
    │   └── ...
│   ├── reports/
│   │   ├── scout-report.md
│   │   ├── researcher-report.md
│   │   └── ...
│   ├── plan.md                                # Overview access point
│   ├── phase-01-setup-environment.md          # Setup environment
│   ├── phase-02-implement-database.md         # Database models
│   ├── phase-03-implement-api-endpoints.md    # API endpoints
│   ├── phase-04-implement-ui-components.md    # UI components
│   ├── phase-05-implement-authentication.md   # Auth & authorization
│   ├── phase-06-implement-profile.md          # Profile page
│   └── phase-07-write-tests.md                # Tests
└── ...
```

#### File Structure

##### Overview Plan (plan.md)
- Keep generic and under 80 lines
- List each phase with status/progress
- Link to detailed phase files
- Key dependencies

##### Phase Files (phase-XX-name.md)
Fully respect the `./docs/development-rules.md` file.
Each phase file should contain:

**Context Links**
- Links to related reports, files, documentation

**Overview**
- Priority
- Current status
- Brief description

**Key Insights**
- Important findings from research
- Critical considerations

**Requirements**
- Functional requirements
- Non-functional requirements

**Architecture**
- System design
- Component interactions
- Data flow

**Related Code Files**
- List of files to modify
- List of files to create
- List of files to delete

**Implementation Steps**
- Detailed, numbered steps
- Specific instructions

**Todo List**
- Checkbox list for tracking

**Success Criteria**
- Definition of done
- Validation methods

**Risk Assessment**
- Potential issues
- Mitigation strategies

**Security Considerations**
- Auth/authorization
- Data protection

**Next Steps**
- Dependencies
- Follow-up tasks