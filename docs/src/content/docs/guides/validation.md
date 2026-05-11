---
title: Validation
description: Validate QuerySchema at runtime boundaries with Zod or Valibot.
---

agnostic-query provides optional Zod and Valibot schemas for validating `QuerySchema` at runtime boundaries — useful for API endpoints, server functions, or any place where untrusted data enters your system.

## Zod

```ts
import { createQuerySchema } from 'agnostic-query/zod'
import type { Project } from './project.table.ts'

// Use as an input validator (example with TanStack server fn)
export const listProject = createServerFn()
  .inputValidator(createQuerySchema<Project>())
  .handler(async ({ data }) => {
    return await toDrizzle(db, projectTable, data)
  })
```

## Valibot

```ts
import { createQuerySchema } from 'agnostic-query/valibot'
```

Both schemas infer the `QuerySchema` type from your shape and validate the structure at runtime.
