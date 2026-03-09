# Schema Pattern — Drizzle ORM Conventions

> _meta: source=`modules/crm/schema/leads.ts`, `shared/db/base-columns.ts`, `modules/finance/billing/schema/invoices.ts` | extracted=2026-02-27

## Canonical Example (annotated from crm_lead)

```typescript
import { pgTable, text, varchar, uuid, boolean, integer, timestamp, bigint, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { baseColumns } from '@/shared/db/base-columns'

// WHY singular: CEO convention XMOD-9 — `crm_lead` not `crm_leads`
export const crmLead = pgTable(
  'crm_lead',
  {
    // WHY spread: injects 7 required columns (id, tenantId, createdAt, updatedAt, createdBy, updatedBy, isDeleted)
    ...baseColumns,

    // WHY varchar(30): entity code for human-readable URLs — `/ops/crm/leads/CRM-240001`
    leadCode: varchar('lead_code', { length: 30 }).notNull().default(''),

    // WHY .references(): explicit FK + always add index on FK column
    personId: uuid('person_id').notNull().references(() => prsPerson.id),

    // Domain fields...
    fullNameVi: text('full_name_vi').notNull(),
    phone: text('phone'),
    status: text('status').notNull().default('active'),

    // WHY bigint: VND money — NEVER numeric(), decimal(), or integer()
    amount: bigint('amount', { mode: 'number' }).notNull().default(0),

    // WHY text not pgEnum: all enums via md_choices table — CEO M-2
    level: text('level').notNull().default('l1'),
  },
  (table) => ({
    // WHY unique with isDeleted filter: soft-delete-aware uniqueness
    tenantCodeIdx: uniqueIndex('uidx_crm_lead_tenant_code')
      .on(table.tenantId, table.leadCode)
      .where(sql`${table.isDeleted} = false`),
    // WHY tenant index: every query filters by tenant
    tenantIdx: index('idx_crm_lead_tenant').on(table.tenantId),
    // WHY FK index: every FK column gets an index for JOIN performance
    personIdIdx: index('idx_crm_lead_person_id').on(table.personId),
  }),
)

// WHY Zod schemas: auto-generated for router input validation
export const insertCrmLeadSchema = createInsertSchema(crmLead)
export const selectCrmLeadSchema = createSelectSchema(crmLead)
export type CrmLead = typeof crmLead.$inferSelect
export type NewCrmLead = typeof crmLead.$inferInsert
```

## baseColumns (7 required fields)

```typescript
export const baseColumns = {
  id: uuid('id').primaryKey().defaultRandom(),         // WHY defaultRandom: never sql`gen_random_uuid()`
  tenantId: text('tenant_id').notNull().default('default'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
} as const
```

## Convention Checklist

| # | Convention | Check |
|---|-----------|-------|
| 1 | `...baseColumns` spread | First field in table definition |
| 2 | Table name singular | `crm_lead` not `crm_leads` |
| 3 | Money = `bigint({ mode: 'number' })` | Never `numeric()`, `decimal()`, `integer()` for VND |
| 4 | UUID default = `.defaultRandom()` | Never `sql\`gen_random_uuid()\`` |
| 5 | Enums = `text()` or `varchar()` | Never `pgEnum` — use `md_choices` table |
| 6 | FK = `.references(() => target.id)` | Explicit reference + index on FK column |
| 7 | Entity code = `varchar('*_code', { length: 30 })` | Per-tenant unique index with `isDeleted = false` filter |
| 8 | Index naming = `idx_{table}_{columns}` | Unique = `uidx_{table}_{columns}` |
| 9 | Tenant index present | `index().on(table.tenantId)` on every table |
| 10 | Zod schemas exported | `createInsertSchema` + `createSelectSchema` + types |

## Index Naming Convention

```
idx_{table_name}_{column_names}     — regular index
uidx_{table_name}_{column_names}    — unique index
```
