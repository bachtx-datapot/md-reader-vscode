# Navigate-First Pattern — agent-browser CLI Rules

## ALWAYS Rules

### 1. Start from root URL only
```bash
agent-browser open http://localhost:3201
```
Never open deep URLs directly. Navigate to every page via UI clicks.

### 2. Find before interact (RT-10)
Every interaction MUST be preceded by a `find` command:
```bash
agent-browser find testid "email-input"     # → @e1
agent-browser fill @e1 "admin@test.com"
```
If `find` returns empty → log `SELECTOR_MISSING`, mark step FAIL, skip.

### 3. Snapshot for context
```bash
agent-browser snapshot -i    # interactive elements only (~280 chars)
```
Use after every navigation to discover available elements. Never guess element references.

### 4. Screenshot for evidence
```bash
agent-browser screenshot -o evidence/screenshots/{stage}/step-{N}-{action}.png
```
Capture before AND after every significant action.

### 5. Wait after navigation
```bash
agent-browser click @eN
agent-browser wait --url "**/{expected-path}"
```
Always wait for URL change after clicking navigation links.

### 6. Video recording
```bash
agent-browser record start                    # Before flow begins
# ... all steps ...
agent-browser record stop                     # Saves recording.webm
mv recording.webm evidence/videos/{stage}/flow.webm
```

### 7. State save for crash recovery
```bash
agent-browser state save quality-reports/{run}/state/auth.json
```
Save after login completes. Used by `--resume` to restore session.

## NEVER Rules

- **No direct URL navigation:** `agent-browser open http://localhost:3201/crm/leads` is BANNED
- **No cookie injection:** `agent-browser eval "document.cookie=..."` is BANNED
- **No localStorage injection:** `agent-browser eval "localStorage.setItem(..."` is BANNED
- **No skipping login:** Always login via UI form, even on resume (re-login if state load fails)
- **No CSS/XPath selectors:** Only `find testid`, `find text`, or `find role`
- **No guessing element refs:** Always `snapshot -i` → then `find` → then act

## Common Patterns

### Login
```bash
agent-browser open http://localhost:3201
agent-browser snapshot -i
agent-browser find testid "email-input"
agent-browser fill @e1 "{email}"
agent-browser find testid "password-input"
agent-browser fill @e2 "{password}"
agent-browser screenshot -o evidence/screenshots/{stage}/step-01-pre-login.png
agent-browser find testid "login-btn"
agent-browser click @e3
agent-browser wait --url "/dashboard"
agent-browser screenshot -o evidence/screenshots/{stage}/step-01-post-login.png
agent-browser state save quality-reports/{run}/state/auth.json
```

### Navigate to section
```bash
agent-browser snapshot -i
agent-browser find testid "nav-{section}"
agent-browser click @eN
agent-browser wait --url "**/{section}"
agent-browser snapshot -i
agent-browser screenshot -o evidence/screenshots/{stage}/step-{N}-nav.png
```

### Fill form
```bash
agent-browser snapshot -i
agent-browser find testid "{field-name}"
agent-browser fill @eN "{value}"
# Repeat for each field
agent-browser screenshot -o evidence/screenshots/{stage}/step-{N}-filled.png
agent-browser find testid "{submit-btn}"
agent-browser click @eN
agent-browser wait --url "**/{expected}"
agent-browser screenshot -o evidence/screenshots/{stage}/step-{N}-submitted.png
```

### Cross-user verification
```bash
# Close current session
agent-browser close
# Open new session as different user
agent-browser open http://localhost:3201
agent-browser find testid "email-input"
agent-browser fill @e1 "{other-user-email}"
# ... login flow ...
# Navigate to data created by first user → verify visibility
```

### Cross-tenant negative test (RT-7)
```bash
# Login as other_tenant_user from .qa-config.yaml
# Navigate to same data → expect 403 or empty list
# Screenshot as proof of tenant isolation
```
