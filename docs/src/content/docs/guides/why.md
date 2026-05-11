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

## The Solution

`agnostic-query` defines a portable `QuerySchema` — a plain JSON format that any of these libraries can convert to and from:

```
TanStack DB  ──fromTanDbWhere──>  QuerySchema  ──toDrizzle──>  Drizzle
aq builder   ──.toJSON()──────>  QuerySchema  ──toKysely──>  Kysely
Kysely query ──fromKysely─────>  QuerySchema  ──toSql──────>  Raw SQL
```

### Client → Server flow

1. **Client**: TanStack DB collection's `queryFn` receives its internal WHERE/ORDER BY expressions
2. **Translation**: `fromTanDbWhere` and `fromTanDbOrderBy` convert them into `QuerySchema`
3. **Serialization**: the `QuerySchema` is sent as JSON to the server (HTTP, RPC, server fn)
4. **Execution**: the server validates it with Zod/Valibot and executes via `toDrizzle` (or `toKysely`/`toSql`)

### Direct builder → Server flow

If you're not using TanStack DB, the `aq` builder constructs `QuerySchema` directly — same format, same server-side execution.

## What It Is Not

`agnostic-query` is not an ORM. It doesn't connect to databases, manage migrations, or replace Drizzle/Kysely on the server. It's a **serialisable intermediate format** that reduces the friction of moving query definitions between layers of your stack.

## When Should You Use It?

- You use **TanStack DB** on the client and **Drizzle** or **Kysely** on the server
- You want to **share query logic** between browser and server without duplication
- You want **type safety across the wire** — the server validates that the incoming query matches your schema
- You want to **switch databases or ORMs** without rewriting client code
