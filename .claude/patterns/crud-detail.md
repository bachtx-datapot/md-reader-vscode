# CRUD Detail Pattern — Detail Page Conventions

> _meta: source=`components/recipes/detail-page.tsx` | extracted=2026-02-28
> Extends: `ui-page.md` (kept for shared layout). Detail-specific CRUD conventions.

## Ops Variant (Admin)

View mode + edit toggle + delete confirm + audit trail tab.

### Canonical Example

```tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { DetailPage } from '@/components/recipes/detail-page'
import { PageHeader } from '@/components/recipes/sections/page-header'
import { usePermission } from '@/hooks/use-permission'
import { trpcReact } from '@/trpc/react'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export default function EntityDetailPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const utils = trpcReact.useUtils()
  const canEdit = usePermission('module:entity:update')
  const canDelete = usePermission('module:entity:delete')

  const { data: entity } = trpcReact.module.entity.getByCode.useQuery({ code })

  const deleteEntity = trpcReact.module.entity.delete.useMutation({
    onSuccess: () => {
      toast.success('Xóa thành công')
      utils.module.entity.list.invalidate()
      router.push('/ops/module/entities')
    },
    onError: (error) => toast.error(`Lỗi: ${error.message}`),
  })

  if (!entity) return <NotFound />

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
          actions={
            <div className="flex gap-2">
              {canEdit && (
                <Button variant="outline" data-testid="entity-edit-btn"
                  onClick={() => router.push(`/ops/module/entities/${code}/edit`)}>
                  Chỉnh sửa
                </Button>
              )}
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" data-testid="entity-delete-btn">Xóa</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa {entity.name}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteEntity.mutate({ id: entity.id })}>
                        Xóa
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          }
        />
      }
      tabs={[
        { label: 'Tổng quan', value: 'overview', content: <OverviewTab entity={entity} /> },
        { label: 'Hoạt động', value: 'activities', content: <ActivitiesTab entityId={entity.id} /> },
        { label: 'Lịch sử', value: 'history', content: <AuditTrailTab entityId={entity.id} /> },
      ]}
      defaultTab="overview"
      sidebar={<EntitySidebar entity={entity} />}
    />
  )
}
```

## Portal Variant (Student/Trainer)

View mode + limited edit (own profile, own requests).

```tsx
export default function PortalEntityDetailPage() {
  const { code } = useParams<{ code: string }>()
  const { data: entity } = trpcReact.portal.entity.getByCode.useQuery({ code })

  return (
    <DetailPage
      header={
        <PageHeader
          title={entity.name}
          breadcrumbs={[
            { label: 'Trang chủ', href: '/portal' },
            { label: 'Entity', href: '/portal/entities' },
            { label: entity.code },
          ]}
        />
      }
      tabs={[
        { label: 'Chi tiết', value: 'detail', content: <DetailTab entity={entity} /> },
      ]}
      defaultTab="detail"
    />
  )
}
```

## URL Convention

```
/ops/{module}/{entities}           — list page
/ops/{module}/{entities}/new        — create page (or CrudSheet modal)
/ops/{module}/{entities}/[code]    — detail page (code, not UUID)
/ops/{module}/{entities}/[code]/edit — edit page
```

## DetailPage Component Props

```typescript
interface DetailPageProps {
  header: React.ReactNode
  tabs?: { label: string; value: string; content: ReactNode }[]
  defaultTab?: string
  children?: React.ReactNode
  sidebar?: React.ReactNode
  className?: string
}
```

## Loading States

```tsx
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function Page() {
  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <EntityDetailPage />
    </Suspense>
  )
}
```

## data-testid Convention

```
{entity}-detail                   — detail page container
{entity}-edit-btn                 — edit button
{entity}-delete-btn               — delete button
{entity}-delete-confirm-btn       — delete confirmation button
{entity}-tab-{name}               — tab trigger
{entity}-tab-content-{name}       — tab content panel
{entity}-sidebar                  — sidebar container
{entity}-field-{name}             — read-only field display
```

## Convention Checklist

| # | Convention | Check |
|---|-----------|-------|
| 1 | Use `DetailPage` for detail views | Consistent header + tabs + sidebar |
| 2 | Use `PageHeader` for headers | Breadcrumbs + title + actions |
| 3 | URL uses `[code]` not `[id]` | Human-readable entity codes |
| 4 | Delete confirmation dialog | `AlertDialog` with explicit confirmation |
| 5 | `usePermission()` for edit/delete | RBAC-gated actions |
| 6 | Tabs for related entities | Activities, history, related records |
| 7 | Sidebar for metadata | Status, dates, assignee info |
| 8 | Suspense boundary | Loading skeleton for async pages |
| 9 | Vietnamese labels | All UI text in Vietnamese |
| 10 | Breadcrumb navigation | Back to list preserves context |

## Testing Requirements

### Unit Test Scenarios
- Detail page loads entity by code
- All fields render correctly
- Edit button navigates to edit page
- Delete shows confirm dialog
- Delete confirm calls mutation + redirects
- Tab navigation works
- 404 page for invalid code
- Permission-gated buttons hidden for unauthorized users

### E2E Test Scenarios (5-scenario audit — detail portion)
1. Navigate to detail by code → verify all fields rendered
2. Click edit → verify navigation to edit page
3. Click delete → confirm → verify DB deleted + redirect to list
4. Tab navigation → verify each tab loads content
5. Invalid code → verify 404 page shown
