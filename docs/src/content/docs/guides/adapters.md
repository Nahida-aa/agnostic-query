---
title: Adapters
description: Convert QuerySchema to any ORM or raw SQL.
---

The same `QuerySchema` can drive Drizzle, Kysely, raw SQL, and TanStack DB adapters.

## Raw SQL (PostgreSQL)

```ts
import { toSql } from 'agnostic-query/sql/pg'

const { sql, params } = toSql({
  table: 'users',
  ...schema,
})!
// → sql:    SELECT * FROM "users" WHERE "age" >= ? AND "status" IN (?, ?) ORDER BY "name" ASC LIMIT 20 OFFSET 0
// → params: [18, 'active', 'pending']
```

Or compose parts yourself using `toSqlWhere` / `toSqlOrderBy` for partial queries.

## Drizzle

One-shot with `toDrizzle`:

```ts
import { toDrizzle } from 'agnostic-query/drizzle/pg'

const rows = await toDrizzle<User>(db, userTable, data)
```

Or compose manually:

```ts
import { toDrizzleWhere, toDrizzleOrderBy } from 'agnostic-query/drizzle/pg'
import { and, eq } from 'drizzle-orm'

const conditions = [
  toDrizzleWhere(schema.user, data.where),
  eq(schema.user.orgId, currentOrgId),
].filter(Boolean)

const rows = await db
  .select()
  .from(schema.user)
  .where(and(...conditions))
  .orderBy(...toDrizzleOrderBy(schema.user, data.orderBy))
  .limit(data.limit ?? 50)
  .offset(data.offset ?? 0)
```

## Kysely

Extract schema from a Kysely query:

```ts
import { fromKysely } from 'agnostic-query/kysely/pg'

const query = db
  .selectFrom('user')
  .selectAll()
  .where('age', '>=', 18)
  .where('status', 'in', ['active', 'pending'])
  .orderBy('name', 'asc')
  .limit(20)

const schema = fromKysely(query)
JSON.stringify(schema) // send to client
```

Apply schema to a Kysely query:

```ts
import { toKyselyWhere, toKyselyOrderBy } from 'agnostic-query/kysely/pg'

let query = db.selectFrom('user').selectAll()

if (schema.where)   query = query.where(toKyselyWhere(schema.where))
if (schema.orderBy) query = toKyselyOrderBy(query, schema.orderBy)
if (schema.limit)   query = query.limit(schema.limit)
if (schema.offset)  query = query.offset(schema.offset)

const users = await query.execute()
```

## TanStack DB

Convert TanStack DB expressions into agnostic-query format:

```ts
import { fromTanDbWhere, fromTanDbOrderBy, fromTanDb } from 'agnostic-query/tanstack-db'

// Manual composition
const data = {
  where: newWhere(fromTanDbWhere(where))
    .where(fromTanDbWhere(cursor?.whereFrom))
    .toJSON(),
  orderBy: fromTanDbOrderBy(orderBy),
}

// Convenience — handles where, cursor, limit, orderBy in one call
const data = fromTanDb<TShape>(meta?.loadSubsetOptions)
```

## db0

Execute a `QuerySchema` as parameterised SQL via db0:

```ts
import { query } from 'agnostic-query/db0/pg'

const rows = await query(db, schema)
```
