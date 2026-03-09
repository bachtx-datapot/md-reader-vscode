# UI Page Pattern — Page Layout Conventions

> _meta: source=`components/recipes/detail-page.tsx`, `components/recipes/list-page.tsx` | extracted=2026-02-27

## List Page Pattern

```tsx
import { ListPage } from '@/components/recipes/list-page'
import { DataTable } from '@/components/recipes/sections/data-table'

// WHY ListPage: consistent layout (header + breadcrumbs + filters + table + pagination)
export default function EntityListPage() {
  return (
    <ListPage
      title="Danh sách Entity"
      description="Quản lý entity"
      breadcrumbs={[
        { label: 'Module', href: '/ops/module' },
        { label: 'Entity' },  // WHY no href on last: current page
      ]}
      actions={<CreateEntityButton />}
      filters={<StatusFilter />}  // Optional filter section
    >
      <DataTable columns={columns} data={data} searchKey="name" />
    </ListPage>
  )
}
```

## Detail Page Pattern

```tsx
import { DetailPage } from '@/components/recipes/detail-page'
import { PageHeader } from '@/components/recipes/sections/page-header'

// WHY DetailPage: consistent layout (header + tabs/content + optional sidebar)
export default function EntityDetailPage({ params }: { params: { code: string } }) {
  return (
    <DetailPage
      header={
        <PageHeader
          title={entity.name}
          description={`Mã: ${entity.code}`}
          breadcrumbs={[
            { label: 'Module', href: '/ops/module' },
            { label: 'Entity', href: '/ops/module/entities' },
            { label: entity.code },
          ]}
          actions={<EditButton />}
        />
      }
      tabs={[
        { label: 'Tổng quan', value: 'overview', content: <OverviewTab /> },
        { label: 'Lịch sử', value: 'history', content: <HistoryTab /> },
      ]}
      defaultTab="overview"
      sidebar={<EntitySidebar entity={entity} />}  // Optional sidebar
    />
  )
}
```

## DetailPage Component Props

```typescript
interface DetailPageProps {
  header: React.ReactNode                                     // Page header (PageHeader)
  tabs?: { label: string; value: string; content: ReactNode }[] // Tab panels
  defaultTab?: string                                          // Initial active tab
  children?: React.ReactNode                                   // Non-tabbed content
  sidebar?: React.ReactNode                                    // Optional right sidebar (300px)
  className?: string
}
```

## URL Convention

```
/ops/{module}/{entities}           — list page
/ops/{module}/{entities}/new       — create page
/ops/{module}/{entities}/[code]    — detail page (WHY code not id: human-readable)
/ops/{module}/{entities}/[code]/edit — edit page
```

## Loading States

```tsx
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// WHY Suspense: streaming loading with skeleton fallback
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EntityListPage />
    </Suspense>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-4 py-6">
      <Skeleton className="h-8 w-48" />      {/* Title */}
      <Skeleton className="h-[400px] w-full" /> {/* Table */}
    </div>
  )
}
```

## Convention Checklist

| # | Convention | Check |
|---|-----------|-------|
| 1 | Use `ListPage` for list views | Consistent header + table layout |
| 2 | Use `DetailPage` for detail views | Consistent header + tabs + sidebar |
| 3 | Use `PageHeader` for headers | Breadcrumbs + title + actions |
| 4 | Breadcrumbs on every page | Last item = current page (no href) |
| 5 | URL uses `[code]` not `[id]` | Human-readable entity codes |
| 6 | Suspense boundary | Loading skeleton for async pages |
| 7 | Vietnamese labels | All UI text in Vietnamese |
| 8 | Tabs for detail views | `{ label, value, content }[]` |
| 9 | Sidebar for metadata | 300px right sidebar (hidden on mobile) |
| 10 | Actions in header | Create/Edit buttons via `actions` prop |
