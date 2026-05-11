---
title: Why Agnostic Query?
description: The problem agnostic-query solves and how it fits into your stack.
---

## The Problem

You use **TanStack DB** to build queries on the client, and **Drizzle** to execute them on the server. But they speak different query languages — the same `WHERE age >= 18` has to be expressed twice in two different APIs, and there's no serialisable format to pass it across the wire.

The result:

- **Duplicate code**: the same filtering logic written twice
- **No shared type safety**: a change to one side doesn't flag mismatches on the other
- **Manual JSON bridging**: you invent your own query-object format and write ad-hoc converters
- **No validation**: no way to guarantee the client isn't sending a malformed query

## Before & After

Here's the real `queryFn` from the [example project](https://github.com/Nahida-aa/agnostic-query/tree/main/examples/tanstack-db) — without and with `agnostic-query`.

### Without agnostic-query

You'd have to manually parse the TanStack DB metadata, invent a JSON format, and write a Drizzle translator on the server:

```ts
// Client: manually building a query object from TanStack DB internals
const data = {
  limit: meta?.loadSubsetOptions?.limit,
  where: manuallyParseWhere(meta?.loadSubsetOptions?.where),
  orderBy: manuallyParseOrderBy(meta?.loadSubsetOptions?.orderBy),
}
// → ad-hoc { limit, where, orderBy } with no shared type
```

```ts
// Server: receive ad-hoc JSON, manually translate to Drizzle
export const listProject = createServerFn()
  .handler(async ({ data }) => {
    // Manually build Drizzle where/orderBy from the JSON
    const conditions = data.where.map(...)
    const rows = await db.select().from(projectTable)
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

const data = fromTanDb<Project>(meta?.loadSubsetOptions)
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

`agnostic-query` is not an ORM. It doesn't connect to databases, manage migrations, or replace Drizzle/Kysely on the server. It's a **serialisable intermediate format** that reduces the friction of moving query definitions between layers of your stack.

## When Should You Use It?

- You use **TanStack DB** on the client and **Drizzle** or **Kysely** on the server
- You want to **share query logic** between browser and server without duplication
- You want **type safety across the wire** — the server validates that the incoming query matches your schema
- You want to **switch databases or ORMs** without rewriting client code
