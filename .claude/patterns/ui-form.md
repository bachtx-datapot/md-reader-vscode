> **DEPRECATED:** This file is superseded by `crud-form.md`. Use `crud-form.md` for all new form implementations.

# UI Form Pattern — Form Component Conventions

> _meta: source=`app/(ops)/ops/crm/leads/_components/create-lead-form.tsx`, `components/recipes/sections/crud-sheet.tsx` | extracted=2026-02-27

## Canonical Example (annotated from create-lead-form)

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

  // WHY zodResolver: Zod schema validates form before submission
  const form = useForm<CreateEntityFormData>({
    resolver: zodResolver(createEntitySchema),
    defaultValues: {
      name: '',
      email: '',
      status: 'active',
    },
  })

  // WHY useMutation: tRPC mutation with success/error handlers
  const createEntity = trpcReact.module.entity.create.useMutation({
    onSuccess: (data) => {
      toast.success('Tạo thành công')
      utils.module.entity.list.invalidate()  // WHY invalidate: refresh list cache
      router.push(`/ops/module/entities/${data.code}`)  // WHY code: URL uses entity code
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
      {/* WHY data-testid on form: E2E test selector */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6"
            data-testid="entity-create-form">

        {/* WHY FormField pattern: consistent Label + Input + Error */}
        <FormField control={form.control} name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên *</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tên" data-testid="entity-name-input" {...field} />
              </FormControl>
              <FormMessage />  {/* WHY FormMessage: auto-shows Zod error */}
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createEntity.isPending}
                data-testid="entity-submit-btn">
          {createEntity.isPending ? 'Đang lưu...' : 'Tạo mới'}
        </Button>
      </form>
    </Form>
  )
}
```

## CrudSheet Pattern (modal form)

```tsx
import { CrudSheet } from '@/components/recipes/sections/crud-sheet'

// WHY CrudSheet: consistent side-panel for CRUD operations
<CrudSheet open={isOpen} onOpenChange={setIsOpen} title="Tạo mới" description="Mô tả">
  <CreateEntityForm onSuccess={() => setIsOpen(false)} />
</CrudSheet>
```

## Field Parity Rule (CRITICAL)

**ALL fields in the router input Zod schema MUST appear in the form Zod schema.**
Missing form fields = user cannot set values = data loss.

```
Router input schema keys  ←→  Form Zod schema keys
If router has `name`, `email`, `status` → form MUST have all three
```

## data-testid Naming Convention

```
{entity}-create-form         — form element
{entity}-{field}-input       — input fields
{entity}-submit-btn          — submit button
{entity}-cancel-btn          — cancel button
{entity}-{field}-select      — select/dropdown
{entity}-{field}-checkbox    — checkbox
```

## Convention Checklist

| # | Convention | Check |
|---|-----------|-------|
| 1 | `react-hook-form` + `zodResolver` | Never uncontrolled forms |
| 2 | Zod schema in separate file | `create-entity-schema.ts` |
| 3 | `FormField` + `FormItem` + `FormLabel` + `FormControl` + `FormMessage` | Full pattern |
| 4 | `data-testid` on form | `{entity}-create-form` |
| 5 | `data-testid` on every input | `{entity}-{field}-input` |
| 6 | `data-testid` on submit button | `{entity}-submit-btn` |
| 7 | `trpcReact.useUtils()` for cache invalidation | On mutation success |
| 8 | `toast.success/error` for feedback | sonner toast library |
| 9 | `CrudSheet` for modal forms | Consistent side-panel |
| 10 | Field parity with router input | Every router field in form |
