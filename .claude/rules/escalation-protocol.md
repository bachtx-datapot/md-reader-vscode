# Escalation Protocol — Self-Fix Loop + Human Handoff

## Self-Fix Loop (max 3 attempts)

```
Implement → Test → FAIL?
  ├── Attempt 1: Analyze error → Apply targeted fix → Re-test
  ├── Attempt 2: Analyze differently → Try alternative approach → Re-test
  ├── Attempt 3: Brainstorm + research → Re-plan → Re-implement → Re-test
  └── STILL FAILING → Escalate to human
```

**Rules:**
- Each attempt MUST use a DIFFERENT fix strategy (no retry loops)
- Log what was tried and why it failed after each attempt
- After attempt 3: write journal entry, document findings, hand off

## Escalation Triggers

### Test Failure (max 3 self-fix attempts)
- **Evidence required:** test output, error message, stack trace
- **Attempt 1:** Read test + source, identify specific failure, fix
- **Attempt 2:** Read broader context (related files, patterns), try different approach
- **Attempt 3:** Use `debugger` agent for root cause analysis
- **Escalate:** Document 3 attempted fixes + analysis in journal

### Spec Ambiguity
- **Evidence required:** spec section reference, conflicting interpretations
- **Attempt 1:** Read related specs (04/05 docs, user stories) for clarification
- **Attempt 2:** Check existing implementations of similar features for precedent
- **Escalate immediately if:** multiple valid interpretations with different outcomes

### Cross-Module Conflict
- **Evidence required:** file paths, conflicting changes, both module contexts
- **Escalate immediately:** do NOT resolve cross-module conflicts autonomously
- **Document:** which modules conflict, what each expects, proposed resolution

### Performance Regression
- **Evidence required:** before/after metrics, profiling data
- **Attempt 1:** Identify hot path, apply targeted optimization
- **Attempt 2:** Review query plans, add indexes or restructure
- **Escalate if:** regression >20% and no clear fix after 2 attempts

### Build/Compile Failure
- **Evidence required:** full error output, affected files
- **Attempt 1:** Read error, fix syntax/type issue
- **Attempt 2:** Check for circular dependencies, import issues
- **Attempt 3:** Check package versions, peer dependency conflicts
- **Escalate:** Document exact error, affected dependency chain

## Evidence Format for Escalation

```markdown
## Escalation Report
- **Category:** {test_failure|spec_ambiguity|cross_module|performance|build}
- **Severity:** {blocking|degraded|cosmetic}
- **Attempts:** {count}/3

### What Was Tried
1. {approach 1} → {outcome}
2. {approach 2} → {outcome}
3. {approach 3} → {outcome}

### Analysis
{Root cause hypothesis, what's still unclear}

### Recommendation
{Suggested next step for human reviewer}
```

## Max Attempts Summary

| Category | Max Self-Fix | Then |
|----------|-------------|------|
| Test failure | 3 | Journal + handoff |
| Spec ambiguity | 2 | Ask human |
| Cross-module conflict | 0 | Immediate escalation |
| Performance regression | 2 | Journal + handoff |
| Build failure | 3 | Journal + handoff |
