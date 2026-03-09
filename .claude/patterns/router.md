# Router Pattern — tRPC Conventions

> _meta: source=`modules/lms/routers/enrollment-core-router.ts` | extracted=2026-02-27

## Canonical Example (annotated from enrollment-core-router)

```typescript
import { router } from '@/trpc/init'
import { permissionProcedure } from '@/trpc/procedures'
import { z } from 'zod'
import type { Database } from '@/shared/db/drizzle'
import { SomeService, createInputSchema, listFilterSchema } from '../services/some-service'
import { mapError } from '../error-mapper'
import { emitEntityCreated } from '../events'

export const entityRouter = router({
  // WHY permissionProcedure: ALL mutations require RBAC — never protectedProcedure
  create: permissionProcedure('{module}:{resource}', 'write')
    .input(createInputSchema)  // WHY Zod: validated before handler runs
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.transaction(async (tx) => {
          const svc = new SomeService(tx as unknown as Database)
          const entity = await svc.create(ctx.tenantId, input, ctx.user.id)
          // WHY emitOutboxEvent inside tx: atomic with business data
          await emitEntityCreated(tx, entity)
          return entity
        })
      } catch (e) {
        return mapError(e)  // WHY error mapper: consistent TRPCError codes
      }
    }),

  // WHY permissionProcedure for reads too: RBAC on all data access
  // Exception: protectedProcedure only for own-data reads (e.g., user profile)
  get: permissionProcedure('{module}:{resource}', 'read')
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        return await new SomeService(ctx.db).getById(ctx.tenantId, input.id)
      } catch (e) {
        return mapError(e)
      }
    }),

  // WHY code-based lookup: entity codes for human-readable URLs
  getByCode: permissionProcedure('{module}:{resource}', 'read')
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // ...
    }),

  // WHY filter schema: separate Zod schema for list filters (pagination, search, status)
  list: permissionProcedure('{module}:{resource}', 'read')
    .input(listFilterSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await new SomeService(ctx.db).list(ctx.tenantId, input)
      } catch (e) {
        return mapError(e)
      }
    }),

  // WHY transition pattern: state machine operations as separate procedures
  activate: permissionProcedure('{module}:{resource}', 'write')
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // ... transaction + emit event
    }),
})
```

## Convention Checklist

| # | Convention | Check |
|---|-----------|-------|
| 1 | `permissionProcedure` for ALL mutations | `('module:resource', 'write')` |
| 2 | `permissionProcedure` for data reads | `('module:resource', 'read')` |
| 3 | `protectedProcedure` only for own-data | User profile, preferences |
| 4 | Zod input validation on every procedure | Never trust raw input |
| 5 | Try/catch with error mapper | Consistent TRPCError codes |
| 6 | Transaction for mutations with events | `ctx.db.transaction(async (tx) => {...})` |
| 7 | Service instantiation inside handler | `new Service(tx as unknown as Database)` |
| 8 | Events emitted inside transaction | `emitOutboxEvent(tx, event)` |
| 9 | List has filter schema | Pagination, search, status filters |
| 10 | Code-based lookup procedure | `getByCode` for human-readable URLs |

## Auth Procedure Decision Table

| Scenario | Procedure | Example |
|----------|-----------|---------|
| Any mutation (create/update/delete) | `permissionProcedure` | All CRUD writes |
| Read any data (list, get, search) | `permissionProcedure` | Entity lists, detail views |
| Read own data only | `protectedProcedure` | User profile, preferences |
| Public endpoint | `publicProcedure` | Health check, public content |

## Error Mapping Pattern

```typescript
// Error mapper converts service errors to TRPCError
import { TRPCError } from '@trpc/server'

export function mapError(e: unknown): never {
  if (e instanceof NotFoundError) throw new TRPCError({ code: 'NOT_FOUND', message: e.message })
  if (e instanceof ValidationError) throw new TRPCError({ code: 'BAD_REQUEST', message: e.message })
  if (e instanceof ConflictError) throw new TRPCError({ code: 'CONFLICT', message: e.message })
  throw e  // Re-throw unknown errors
}
```

## Reserved Procedure Names (tRPC limitation)

Cannot use: `apply`, `bind`, `call`, `constructor`, `prototype` — conflicts with `Function.prototype`.
