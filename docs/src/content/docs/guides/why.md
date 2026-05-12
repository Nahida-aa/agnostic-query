---
title: Why Agnostic Query?
description: The problem agnostic-query solves and how it fits into your stack.
---

## The Problem

You use **TanStack DB** to build queries on the client, and **Drizzle** to execute them on the server. But they speak different query languages — the client produces `LoadSubsetOptions`, the server expects Drizzle conditions, and there's no serialisable format to pass the query across the wire.

The result:

- **Duplicate code**: the same filtering logic written twice
- **No shared type safety**: a change to one side doesn't flag mismatches on the other
- **Manual JSON bridging**: you invent your own query-object format and write ad-hoc converters
- **No validation**: no way to guarantee the client isn't sending a malformed query

## Before & After

Here's the same scenario — a client query driven by TanStack DB, executed by Drizzle on the server — built without and with `agnostic-query`.

### Without agnostic-query

The official TanStack DB docs show this pattern ([Quick Start: Simple REST API](https://tanstack.com/db/latest/docs/collections/query-collection#quick-start-simple-rest-api)):

```ts
// Client: manually parse LoadSubsetOptions and build URL params
import { parseLoadSubsetOptions } from '@tanstack/db'

queryFn: async (ctx) => {
  const parsed = parseLoadSubsetOptions(ctx.meta?.loadSubsetOptions)
  const params = new URLSearchParams()

  parsed.filters.forEach(({ field, operator, value }) => {
    const fieldName = field.join('.')
    if (operator === 'eq') params.set(fieldName, String(value))
    if (operator === 'lt') params.set(`${fieldName}_lt`, String(value))
    // ... handle every operator manually
  })

  parsed.sorts.forEach(s => {
    params.set('sort', `${s.field.join('.')}:${s.direction}`)
  })

  if (parsed.limit) params.set('limit', String(parsed.limit))

  const response = await fetch(`/api/products?${params}`)
  return response.json()
}
```

```ts
// Server: receive URL params, manually translate to Drizzle
// No shared type, no validation
export const listProject = createServerFn()
  .handler(async ({ data }) => {
    const conditions = []
    if (data.name) conditions.push(eq(projectTable.name, data.name))
    if (data.age_lt) conditions.push(lt(projectTable.age, Number(data.age_lt)))
    // ... each filter mapped manually

    const rows = await db.select()
      .from(projectTable)
      .where(and(...conditions))
      .orderBy(...)
      .limit(data.limit)
    return rows
  })
```

### With agnostic-query

One call on each side, shared types, automatic validation:

```ts
// Client: fromTanDb handles where, cursor, limit, orderBy in one line
import { fromTanDb } from 'agnostic-query/tanstack-db'

const data = fromTanDb(meta?.loadSubsetOptions)
// → typed QuerySchema<Project>
```

```ts
// Server: receive QuerySchema, execute via Drizzle, validate automatically
import { toDrizzle } from 'agnostic-query/drizzle/pg'
import { createQuerySchema } from 'agnostic-query/zod'

export const listProject = createServerFn()
  .inputValidator(createQuerySchema<Project>())
  .handler(async ({ data }) => {
    return await toDrizzle(db, projectTable, data)
    // → typed Promise<Project[]>
  })
```

## The Solution

`agnostic-query` defines a portable `QuerySchema` — a plain JSON format that any of these libraries can convert to and from:

```
TanStack DB  ──fromTanDbWhere──>  QuerySchema  ──toDrizzle──>  Drizzle
aq builder   ──.toJSON()──────>  QuerySchema  ──toKysely──>  Kysely
Kysely query ──fromKysely─────>  QuerySchema  ──toSql──────>  Raw SQL
```

### Client → Server flow

1. **Client**: TanStack DB collection's `queryFn` receives its internal WHERE/ORDER BY expressions
2. **Translation**: `fromTanDb` converts them into `QuerySchema` in one call
3. **Serialization**: the `QuerySchema` is sent as JSON to the server (HTTP, RPC, server fn)
4. **Execution**: the server validates it with Zod/Valibot and executes via `toDrizzle`

## What It Is Not

`agnostic-query` is not an ORM. It doesn't manage connections, schemas, or migrations. What it does provide are **tree-shakeable adapters** (`toDrizzle`, `toKysely`, `toDb0`) that convert or execute queries on the server — so you can send a portable `QuerySchema` from the client and run it against any backend without coupling your client code to a specific ORM.

## When Should You Use It?

- You use **TanStack DB** on the client and **Drizzle** or **Kysely** on the server
- You want to **share query logic** between browser and server without duplication
- You want **type safety across the wire** — the server validates that the incoming query matches your schema
- You want to **switch databases or ORMs** without rewriting client code
