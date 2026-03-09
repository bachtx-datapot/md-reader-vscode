> **DEPRECATED:** This file is superseded by `crud-list.md`. Use `crud-list.md` for all new list page implementations.

# UI Table Pattern — Data Table Conventions

> _meta: source=`components/recipes/sections/data-table.tsx`, `components/recipes/list-page.tsx` | extracted=2026-02-27

## Canonical Usage (annotated from DataTable recipe)

```tsx
import { DataTable } from '@/components/recipes/sections/data-table'
import { ListPage } from '@/components/recipes/list-page'
import type { ColumnDef } from '@tanstack/react-table'

// WHY ColumnDef array: typed column definitions with accessors + formatters
const columns: ColumnDef<EntityType>[] = [
  {
    accessorKey: 'code',
    header: 'Mã',
    cell: ({ row }) => <span data-testid={`entity-row-code`}>{row.getValue('code')}</span>,
  },
  {
    accessorKey: 'name',
    header: 'Tên',
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    // WHY filterFn: enables column-level filtering
    filterFn: 'equals',
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
  {
    id: 'actions',
    // WHY no accessorKey: computed column for row actions
    cell: ({ row }) => <RowActions entity={row.original} />,
  },
]

// WHY ListPage wrapper: consistent page layout (header + filters + table + pagination)
export default function EntityListPage() {
  const { data } = trpcReact.module.entity.list.useQuery({ /* filters */ })

  return (
    <ListPage
      title="Danh sách"
      description="Mô tả ngắn"
      breadcrumbs={[{ label: 'Module', href: '/ops/module' }, { label: 'Entity' }]}
      actions={<CreateButton />}
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

## DataTable Component Props

```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]  // Column definitions
  data: TData[]                         // Row data
  searchKey?: string                    // Column key for search bar
  searchPlaceholder?: string            // Search input placeholder
  emptyMessage?: string                 // Empty state text
  toolbar?: React.ReactNode             // Custom toolbar content
  onRowClick?: (row: TData) => void     // Row click handler
  className?: string                    // Container className
}
```

## ListPage Component Props

```typescript
interface ListPageProps {
  title: string                                    // Page title
  description?: string                             // Subtitle
  actions?: React.ReactNode                        // Header action buttons
  breadcrumbs?: { label: string; href?: string }[] // Breadcrumb trail
  filters?: React.ReactNode                        // Filter section
  children: React.ReactNode                        // Table content
  pagination?: React.ReactNode                     // Pagination controls
  className?: string
}
```

## Convention Checklist

| # | Convention | Check |
|---|-----------|-------|
| 1 | Use `DataTable` from recipes | Never build raw `<table>` |
| 2 | Use `ListPage` wrapper | Consistent page layout |
| 3 | `data-testid` on container | `data-table-container` (auto) |
| 4 | `data-testid` on rows | `data-table-row-{id}` (auto) |
| 5 | `data-testid` on headers | `data-table-header-{id}` (auto) |
| 6 | `data-testid` on empty state | `data-table-empty` (auto) |
| 7 | Column types explicit | `ColumnDef<EntityType>[]` — never `any` |
| 8 | `searchKey` for filtering | Points to searchable column |
| 9 | `onRowClick` for navigation | Navigate to detail via entity code |
| 10 | Vietnamese labels | UI text in Vietnamese for ops app |
