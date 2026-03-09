# Service Pattern — Business Logic Layer Conventions

> _meta: source=`modules/persons/services/person-resolution-service.ts`, `modules/crm/services/company-service.ts` | extracted=2026-02-27

## Canonical Example (annotated from PersonResolutionService)

```typescript
import { eq, and, sql } from 'drizzle-orm'
import type { Database } from '@/shared/db/drizzle'
import { someTable, type SomeEntity } from '../schema/some-table'
import { createModuleLogger } from '@/shared/logger'

// WHY createModuleLogger: structured logging with module context — NEVER console.log
const logger = createModuleLogger('module-name')

export interface ServiceResult {
  entity: SomeEntity
  isNew: boolean
}

/**
 * WHY JSDoc: documents purpose, guarantees, and usage context.
 * Provides idempotent resolve-or-create by single identifier.
 */
export class SomeService {
  // WHY constructor DI: receives db/tx for testability and transaction support
  constructor(private readonly db: Database) {}

  /**
   * WHY method-level JSDoc: explains behavior, edge cases, idempotency guarantees.
   */
  async create(
    tenantId: string,
    input: CreateInput,
    userId: string,
  ): Promise<ServiceResult> {
    // WHY validation first: validate before touching DB
    if (!input.requiredField) {
      throw new Error('Required field missing')
    }

    // WHY try/catch: handle unique violations for race-condition safety
    try {
      const [created] = await this.db
        .insert(someTable)
        .values({
          tenantId,
          ...input,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning()

      return { entity: created!, isNew: true }
    } catch (err: unknown) {
      // WHY unique violation handling: concurrent calls may race
      if (isUniqueViolation(err)) {
        const [existing] = await this.db.select().from(someTable)
          .where(and(eq(someTable.tenantId, tenantId), eq(someTable.key, input.key)))
          .limit(1)
        return { entity: existing!, isNew: false }
      }
      // WHY structured error logging: captures context for debugging
      logger.error('Failed to create entity', { tenantId, error: err })
      throw err
    }
  }

  async getById(tenantId: string, id: string): Promise<SomeEntity> {
    const [entity] = await this.db.select().from(someTable)
      .where(and(
        eq(someTable.tenantId, tenantId),
        eq(someTable.id, id),
        eq(someTable.isDeleted, false),  // WHY isDeleted filter: soft-delete convention
      ))
      .limit(1)

    if (!entity) throw new NotFoundError('Entity not found')
    return entity
  }

  // WHY list with filters: pagination + search + status filtering
  async list(tenantId: string, filters: ListFilters) {
    // ... query builder with dynamic where clauses
  }
}

// WHY helper: PostgreSQL unique violation error code check
function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string })?.code === '23505'
}
```

## Convention Checklist

| # | Convention | Check |
|---|-----------|-------|
| 1 | `createModuleLogger()` at file top | Never `console.log` in production |
| 2 | Constructor DI: `constructor(private readonly db: Database)` | For testability + tx support |
| 3 | Try/catch with structured error logging | `logger.error('message', { context })` |
| 4 | Tenant isolation in every query | `eq(table.tenantId, tenantId)` |
| 5 | Soft-delete filter | `eq(table.isDeleted, false)` in reads |
| 6 | Explicit return types | Never `any` — define interfaces |
| 7 | Validation before DB access | Check inputs first, then query |
| 8 | Unique violation handling (23505) | For idempotent operations |
| 9 | Transaction via db.transaction() | For multi-table operations |
| 10 | Events via `emitOutboxEvent(tx, event)` | Inside transaction — see `patterns/event.md` |

## Service Method Signature Pattern

```typescript
// Standard CRUD method signatures
async create(tenantId: string, input: CreateInput, userId: string): Promise<Entity>
async getById(tenantId: string, id: string): Promise<Entity>
async getByCode(tenantId: string, code: string): Promise<Entity>
async list(tenantId: string, filters: ListFilters): Promise<{ items: Entity[]; total: number }>
async update(tenantId: string, id: string, input: UpdateInput, userId: string): Promise<Entity>
async softDelete(tenantId: string, id: string, userId: string): Promise<void>
```
