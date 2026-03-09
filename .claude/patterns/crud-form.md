# CRUD Form Pattern — Create/Edit Form Conventions

> _meta: source=`app/(ops)/ops/crm/leads/_components/create-lead-form.tsx`, `components/recipes/sections/crud-sheet.tsx` | extracted=2026-02-28
> Replaces: `ui-form.md` (deprecated). Canonical CRUD-aware form pattern for both Ops and Portal surfaces.

## Ops Variant (Admin)

Full field set from user story requirements. Create + Edit modes.

### Canonical Example (Create Form)

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpcReact } from '@/trpc/react'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createEntitySchema, type CreateEntityFormData } from './create-entity-schema'

export function CreateEntityForm() {
  const router = useRouter()
  const utils = trpcReact.useUtils()

  const form = useForm<CreateEntityFormData>({
    resolver: zodResolver(createEntitySchema),
    defaultValues: {
      name: '',
      email: '',
      status: 'active',
    },
  })

  const createEntity = trpcReact.module.entity.create.useMutation({
    onSuccess: (data) => {
      toast.success('Tạo thành công')
      utils.module.entity.list.invalidate()
      router.push(`/ops/module/entities/${data.code}`)
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })

  const onSubmit = (data: CreateEntityFormData) => {
    createEntity.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6"
            data-testid="entity-create-form">
        <FormField control={form.control} name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên *</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tên" data-testid="entity-name-input" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}
                  data-testid="entity-cancel-btn">
            Hủy
          </Button>
          <Button type="submit" disabled={createEntity.isPending}
                  data-testid="entity-submit-btn">
            {createEntity.isPending ? 'Đang lưu...' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

### CrudSheet Pattern (Modal Form)

```tsx
import { CrudSheet } from '@/components/recipes/sections/crud-sheet'

<CrudSheet open={isOpen} onOpenChange={setIsOpen} title="Tạo mới" description="Mô tả">
  <CreateEntityForm onSuccess={() => setIsOpen(false)} />
</CrudSheet>
```

## Portal Variant (Student/Trainer)

Limited fields — own data only. Simpler layout.

```tsx
export function PortalProfileForm() {
  // Portal forms: fewer fields, own-data mutations only
  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: profileData,
  })

  const updateProfile = trpcReact.portal.profile.update.useMutation({
    onSuccess: () => toast.success('Cập nhật thành công'),
    onError: (error) => toast.error(`Lỗi: ${error.message}`),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateProfile.mutate(data))}
            data-testid="profile-edit-form">
        {/* Limited field set */}
      </form>
    </Form>
  )
}
```

## Field Parity Rule (CRITICAL)

**ALL fields in the router input Zod schema MUST appear in the form Zod schema.**

```
Router input schema keys  ←→  Form Zod schema keys
If router has `name`, `email`, `status` → form MUST have all three
```

## Field Mapping: Story → Form → Schema

```
User Story → "Student needs to enter: full name, email, phone, course preference"
     ↓
Form Fields → fullName (text), email (email), phone (tel), courseId (select)
     ↓
Schema Columns → full_name (text), email (varchar), phone (varchar), course_id (uuid FK)
```

Story drives what fields appear. Schema validates they exist. Parity check catches gaps.

## data-testid Convention

```
{entity}-create-form              — create form element
{entity}-edit-form                — edit form element
{entity}-{field}-input            — text input fields
{entity}-{field}-select           — select/dropdown
{entity}-{field}-checkbox         — checkbox
{entity}-{field}-date             — date picker
{entity}-submit-btn               — submit button
{entity}-cancel-btn               — cancel button
{entity}-delete-btn               — delete button (edit mode)
```

## Convention Checklist

| # | Convention | Check |
|---|-----------|-------|
| 1 | `react-hook-form` + `zodResolver` | Never uncontrolled forms |
| 2 | Zod schema in separate file | `create-entity-schema.ts` |
| 3 | `FormField` + `FormItem` + `FormLabel` + `FormControl` + `FormMessage` | Full pattern |
| 4 | `data-testid` on form + every input + submit/cancel | Required |
| 5 | `trpcReact.useUtils()` for cache invalidation | On mutation success |
| 6 | `toast.success/error` for feedback | sonner toast library |
| 7 | `CrudSheet` for modal forms | Consistent side-panel |
| 8 | Field parity with router input | Every router field in form |
| 9 | `usePermission()` for action visibility | RBAC-gated mutations |
| 10 | Tenant context | `ensureTenant` middleware on backend |

## Testing Requirements

### Unit Test Scenarios
- Form renders all required fields
- Zod validation rejects invalid input
- Submit calls correct tRPC mutation
- Success shows toast + navigates to list/detail
- Error shows error message (NOT silent fail)
- Cancel navigates back without saving
- Edit mode pre-fills with existing data

### E2E Test Scenarios (5-scenario audit — form portion)
1. Create → fill form → submit → verify DB record + redirect to detail
2. Create with invalid data → verify validation error shown
3. Edit → modify fields → save → verify DB updated + toast
4. Edit → cancel → verify no changes saved
5. Double-submit guard → verify only one mutation fires
