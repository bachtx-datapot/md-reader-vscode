# Test Pattern — Testing Conventions

> _meta: source=`apps/ops/tests/helpers/test-trpc.ts`, `apps/ops/tests/helpers/test-db.ts` | extracted=2026-02-27

## Test Helpers

### Test Caller (tRPC procedures without HTTP)

```typescript
import { createTestCaller } from 'tests/helpers/test-trpc'

// WHY createTestCaller: calls tRPC procedures directly — no server needed
const caller = createTestCaller({
  userId: 'test-user-id',
  email: 'test@datapot.local',
  tenantId: 'test-tenant',
  role: 'admin',
})

// Usage: caller.module.entity.create({ ...input })
```

### DB Fixture (transaction isolation)

```typescript
import { useDbFixture, db } from 'tests/helpers/test-db'

describe('EntityService', () => {
  // WHY useDbFixture: wraps each test in SAVEPOINT — auto-rollback, no cleanup
  useDbFixture()

  it('should create entity', async () => {
    // Test uses real DB but changes are rolled back after test
  })
})
```

## Test File Structure

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { createTestCaller } from 'tests/helpers/test-trpc'
import { useDbFixture } from 'tests/helpers/test-db'

describe('module.entity', () => {
  useDbFixture()

  // WHY fixture data: reusable test data created once
  let caller: ReturnType<typeof createTestCaller>

  beforeAll(() => {
    caller = createTestCaller({ userId: 'user-1', tenantId: 'tenant-1' })
  })

  // WHY describe per operation: organized by CRUD action
  describe('create', () => {
    // 1. Happy path
    it('should create entity with valid input', async () => {
      const result = await caller.module.entity.create({ name: 'Test', ... })
      expect(result.id).toBeDefined()
      expect(result.name).toBe('Test')
    })

    // 2. Validation error
    it('should reject invalid input', async () => {
      await expect(caller.module.entity.create({ name: '' }))
        .rejects.toThrow() // or .rejects.toMatchObject({ code: 'BAD_REQUEST' })
    })

    // 3. Not-found (FK reference)
    it('should fail when referenced entity does not exist', async () => {
      await expect(caller.module.entity.create({ parentId: 'nonexistent' }))
        .rejects.toThrow()
    })

    // 4. Auth failure
    it('should reject unauthenticated request', async () => {
      const anonCaller = createTestCaller()  // no userId
      await expect(anonCaller.module.entity.create({ name: 'Test' }))
        .rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    })

    // 5. Business rule violation
    it('should reject duplicate entity code within tenant', async () => {
      await caller.module.entity.create({ code: 'ENT-001', ... })
      await expect(caller.module.entity.create({ code: 'ENT-001', ... }))
        .rejects.toThrow() // unique constraint
    })
  })
})
```

## 5-Scenario Audit Template

Every service method / tRPC procedure MUST cover these scenarios:

| # | Scenario | What to Test |
|---|----------|-------------|
| 1 | **Happy path** | Valid input → correct output + side effects |
| 2 | **Validation error** | Invalid/missing input → BAD_REQUEST |
| 3 | **Not-found** | Unknown ID/code → NOT_FOUND |
| 4 | **Auth failure** | No/wrong token → UNAUTHORIZED/FORBIDDEN |
| 5 | **Business rule violation** | Duplicate, invalid state transition, constraint violation |

## Coverage Targets

| Metric | Target |
|--------|--------|
| Line coverage | ≥80% |
| Branch coverage | ≥70% |
| Scenario coverage | All 5 types per procedure |

## Convention Checklist

| # | Convention | Check |
|---|-----------|-------|
| 1 | Use `createTestCaller()` for tRPC tests | Never start HTTP server |
| 2 | Use `useDbFixture()` for DB tests | SAVEPOINT isolation per test |
| 3 | `describe` per CRUD operation | `describe('create', ...)` |
| 4 | All 5 scenario types covered | Happy + validation + not-found + auth + business rule |
| 5 | Real DB assertions | Never mock DB — use fixture |
| 6 | Vitest `expect` assertions | `toBe`, `toBeDefined`, `rejects.toThrow` |
| 7 | Test data in `beforeAll` | Shared fixtures across tests |
| 8 | No console.log in tests | Use structured assertions |
| 9 | Coverage ≥80% line, ≥70% branch | Enforced in CI |
| 10 | File location: `tests/{module}/` | Mirror source module structure |
