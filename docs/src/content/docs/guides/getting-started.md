---
title: Getting Started
description: Install agnostic-query and write your first QuerySchema.
---

## Installation

```bash
bun add agnostic-query
```

Then install only the adapters you need:

```bash
# For runtime validation
bun add zod          # optional
bun add valibot      # optional

# For ORM adapters
bun add drizzle-orm  # optional
bun add @tanstack/query-db-collection  # optional

# For Kysely adapter
bun add kysely  # optional
```

## First QuerySchema

Define your shape as a TypeScript `interface` or `type`, then build a query with the `aq` builder:

```ts
import { aq } from 'agnostic-query'

type User = {
  name: string
  age: number
  status: string
}

const schema = aq<User>()
  .where('name', '=', 'Alice')
  .where('age', '>=', 18)
  .where('status', 'in', ['active', 'pending'])
  .orderBy('name', 'asc')
  .limit(20)
  .toJSON()
```

The output is a plain JSON object:

```ts
// schema → {
//   where: {
//     op: 'and',
//     conditions: [
//       { field: ['name'], op: '=', value: 'Alice' },
//       { field: ['age'], op: '>=', value: 18 },
//       { field: ['status'], op: 'in', values: ['active', 'pending'] },
//     ],
//   },
//   orderBy: [{ field: ['name'], direction: 'asc' }],
//   limit: 20,
// }
```

## Import Paths

```ts
// Core types & builder
import { aq, QuerySchema, QueryWhere, QueryOrderBy, findWhere, newComparisonWhere, newWhere } from 'agnostic-query'

// Zod validation
import { createWhereSchema } from 'agnostic-query/zod'

// Valibot validation
import { createWhereSchema } from 'agnostic-query/valibot'

// Drizzle adapter
import { toDrizzle, toDrizzleWhere, toDrizzleOrderBy } from 'agnostic-query/drizzle/pg'

// db0 adapter
import { toDb0 } from 'agnostic-query/db0/pg'

// TanStack DB adapter
import { fromTanDbWhere, fromTanDbOrderBy } from 'agnostic-query/tanstack-db'

// Kysely adapter
import { fromKysely, toKyselyWhere, toKyselyOrderBy } from 'agnostic-query/kysely/pg'

// SQL adapter
import { toSql, toSqlWhere, toSqlOrderBy } from 'agnostic-query/sql/pg'
```
