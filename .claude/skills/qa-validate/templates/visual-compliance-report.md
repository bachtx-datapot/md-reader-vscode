# Visual Compliance Report

**Process:** {process-name}
**Run ID:** {run-id}
**Date:** {date}
**Verdict:** {PASS | FAIL | INCONCLUSIVE}

## Per-Page Results

| Page | Viewport | Finding | Severity | WCAG Criterion | Screenshot |
|------|----------|---------|----------|----------------|------------|
| {page} | {1280/768/375} | {issue} | {HIGH/MED/LOW} | {criterion} | [link](./evidence/...) |

## Responsive Behavior

| Page | Desktop (1280) | Tablet (768) | Mobile (375) | Issues |
|------|---------------|-------------|-------------|--------|
| {page} | OK/ISSUE | OK/ISSUE | OK/ISSUE | {details} |

## Color Contrast

| Element | Foreground | Background | Ratio | WCAG AA | Status |
|---------|-----------|------------|-------|---------|--------|
| {element} | {color} | {color} | {ratio} | {4.5:1/3:1} | PASS/FAIL |

## Touch Targets (Mobile)

| Element | Size | Min Required | Status |
|---------|------|-------------|--------|
| {element} | {WxH}px | 44x44px | PASS/FAIL |

## Summary
- Pages checked: {N}
- Viewports per page: 3
- Total screenshots: {N*3}
- Findings: HIGH: {N}, MED: {N}, LOW: {N}
