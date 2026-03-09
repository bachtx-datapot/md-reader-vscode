# CRUD List Pattern — DataTable Conventions

> _meta: source=`components/recipes/sections/data-table.tsx`, `components/recipes/list-page.tsx` | extracted=2026-02-28
> Replaces: `ui-table.md` (deprecated). Canonical CRUD-aware list pattern for both Ops and Portal surfaces.

## Ops Variant (Admin)

Full DataTable with sortable/filterable columns, bulk actions, row navigation.

### Canonical Example

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/recipes/sections/data-table'
import { ListPage } from '@/components/recipes/list-page'
import { usePermission } from '@/hooks/use-permission'
import { trpcReact } from '@/trpc/react'
import type { ColumnDef } from '@tanstack/react-table'

const columns: ColumnDef<EntityType>[] = [
  {
    accessorKey: 'code',
    header: 'Mã',
    cell: ({ row }) => (
      <span data-testid={`entity-row-${row.original.code}`}>
        {row.getValue('code')}
      </span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Tên',
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    filterFn: 'equals',
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
  {
    id: 'actions',
    cell: ({ row }) => <RowActions entity={row.original} />,
  },
]

export default function EntityListPage() {
  const router = useRouter()
  const { data } = trpcReact.module.entity.list.useQuery({ /* filters */ })
  const canCreate = usePermission('module:entity:create')

  return (
    <ListPage
      title="Danh sách"
      description="Quản lý entity"
      breadcrumbs={[{ label: 'Module', href: '/ops/module' }, { label: 'Entity' }]}
      actions={canCreate && <CreateButton data-testid="entity-create-btn" />}
    >
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        searchKey="name"
        searchPlaceholder="Tìm kiếm..."
        onRowClick={(row) => router.push(`/ops/module/entities/${row.code}`)}
      />
    </ListPage>
  )
}
```

### Ops Features
- Sortable/filterable columns via TanStack Table
- Bulk actions (delete, status change, export) — gated by `usePermission()`
- Row click → navigate to detail page using `[code]`
- Server-side pagination (configurable page size)
- Empty state, loading skeleton, error boundary
- All interactive elements need `data-testid`

## Portal Variant (Student/Trainer)

Read-heavy table with fewer columns, limited permissions.

```tsx
export default function PortalEntityListPage() {
  const { data } = trpcReact.module.entity.listOwn.useQuery()

  return (
    <ListPage
      title="Danh sách của tôi"
      breadcrumbs={[{ label: 'Trang chủ', href: '/portal' }, { label: 'Entity' }]}
    >
      <DataTable
        columns={portalColumns}
        data={data?.items ?? []}
        searchKey="name"
        onRowClick={(row) => router.push(`/portal/entities/${row.code}`)}
      />
    </ListPage>
  )
}
```

### Portal Features
- Read-heavy (fewer columns, simpler layout)
- Row click → detail view (read-only by default)
- No bulk actions (limited permissions)
- Status badge + filter by own records only
- Mobile-responsive (collapse columns on small screens)

## DataTable Component Props

```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  emptyMessage?: string
  toolbar?: React.ReactNode
  onRowClick?: (row: TData) => void
  className?: string
}
```

## ListPage Component Props

```typescript
interface ListPageProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  filters?: React.ReactNode
  children: React.ReactNode
  pagination?: React.ReactNode
  className?: string
}
```

## Field Mapping: Story → Table Columns

```
User Story → "Ops staff needs to see: code, name, status, assignee, created date"
     ↓
Table Columns → code (text), name (text), status (badge), assignee (avatar+name), createdAt (date)
     ↓
Schema Columns → code (varchar), name (text), status (text FK md_choices), assigned_to (uuid FK), created_at (timestamp)
```

## Convention Checklist

| # | Convention | Check |
|---|-----------|-------|
| 1 | Use `DataTable` from recipes | Never build raw `<table>` |
| 2 | Use `ListPage` wrapper | Consistent page layout |
| 3 | `usePermission()` for conditional actions | Hide buttons user cannot perform |
| 4 | Tenant context verification | `ensureTenant` on backend queries |
| 5 | RBAC-aware UI | Actions gated by permissions |
| 6 | Canonical 403 handling | Toast error for denied actions |
| 7 | Column types explicit | `ColumnDef<EntityType>[]` — never `any` |
| 8 | `searchKey` for filtering | Points to searchable column |
| 9 | `onRowClick` for navigation | Navigate to detail via entity code |
| 10 | Vietnamese labels | UI text in Vietnamese for ops app |

## data-testid Convention

```
{entity}-table                    — DataTable container
{entity}-create-btn               — Create button
{entity}-row-{code}               — Table row by entity code
{entity}-filter-{field}           — Filter input
{entity}-sort-{field}             — Sort button
{entity}-bulk-{action}            — Bulk action button
{entity}-pagination               — Pagination controls
{entity}-search-input             — Search input
{entity}-empty-state              — Empty state container
```

## Testing Requirements

### Unit Test Scenarios
- Table renders with correct columns
- Pagination changes page
- Filter applies correctly
- Sort toggles asc/desc
- Empty state renders when no data
- Loading skeleton appears during fetch
- Permission-gated buttons hidden for unauthorized users

### E2E Test Scenarios (5-scenario audit — list portion)
1. Navigate to list → verify table renders with data
2. Search → verify results filtered
3. Sort by column → verify order changes
4. Paginate → verify page changes
5. Click row → verify navigation to detail page
