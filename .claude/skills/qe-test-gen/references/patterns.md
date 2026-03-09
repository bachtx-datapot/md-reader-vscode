# Test Generation Patterns — Our Stack

Attribution: Adapted from agentic-qe (MIT) by proffesor-for-testing

## Playwright Conventions

### File Structure
```
tests/e2e/
├── {domain}/
│   ├── {sub}/
│   │   ├── {feature}.e2e.spec.ts
│   │   └── ...
│   └── ...
└── global-setup.ts
```

### Auth Setup
```typescript
// Use pre-authenticated state from global-setup
test.use({ storageState: 'tests/.auth/admin.json' });
```

### Selectors (data-testid only)
```typescript
// CORRECT: data-testid
await page.getByTestId('lead-create-btn').click();
await page.getByTestId('lead-name-input').fill('Test Lead');

// WRONG: CSS class, XPath, text (fragile)
// await page.locator('.btn-primary').click();
// await page.locator('//button[@type="submit"]').click();
```

### CRUD Test Template

```typescript
test.describe('{Entity} CRUD', () => {
  const testCode = `TEST-${Date.now()}`;

  test('create new {entity}', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-{section}').click();
    await page.getByTestId('{entity}-create-btn').click();
    // Fill form fields
    await page.getByTestId('{entity}-name-input').fill('Test Name');
    await page.getByTestId('{entity}-submit-btn').click();
    // Verify success
    await expect(page.getByTestId('toast-success')).toBeVisible();
  });

  test('view {entity} detail', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-{section}').click();
    // Search and click
    await page.getByTestId('search-input').fill(testCode);
    await page.getByTestId(`row-${testCode}`).click();
    await expect(page.getByTestId('{entity}-detail-title')).toBeVisible();
  });

  test('update {entity}', async ({ page }) => {
    // Navigate to detail → edit
    await page.getByTestId('{entity}-edit-btn').click();
    await page.getByTestId('{entity}-name-input').fill('Updated Name');
    await page.getByTestId('{entity}-submit-btn').click();
    await expect(page.getByTestId('toast-success')).toBeVisible();
  });

  test('delete {entity}', async ({ page }) => {
    await page.getByTestId('{entity}-delete-btn').click();
    await page.getByTestId('confirm-delete-btn').click();
    await expect(page.getByTestId('toast-success')).toBeVisible();
  });
});
```

### Error Scenario Template
```typescript
test('rejects invalid input', async ({ page }) => {
  await page.getByTestId('{entity}-name-input').fill('');
  await page.getByTestId('{entity}-submit-btn').click();
  await expect(page.getByTestId('field-error-name')).toBeVisible();
});

test.describe('unauthorized access', () => {
  test.use({ storageState: 'tests/.auth/staff.json' });

  test('rejects unauthorized access', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/.*login|.*unauthorized/);
  });
});
```

### Cross-Tenant Test
```typescript
test.describe('cross-tenant isolation', () => {
  test.use({ storageState: 'tests/.auth/other-tenant.json' });

  test('prevents cross-tenant data access', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-{section}').click();
    // Verify data from first tenant NOT visible
    await expect(page.getByTestId(`row-${testCode}`)).not.toBeVisible();
  });
```

## Router → Test Mapping

| Router Procedure | Test Type | Template |
|-----------------|-----------|----------|
| `.list` | List page | Load, pagination, search, filter |
| `.getByCode` | Detail page | Load, display fields, breadcrumb |
| `.create` | Create flow | Form fill, validation, submit, verify |
| `.update` | Edit flow | Load existing, modify, verify |
| `.delete` | Delete flow | Confirm dialog, soft delete, verify |
| `.export` | Export | Trigger, download, verify format |
