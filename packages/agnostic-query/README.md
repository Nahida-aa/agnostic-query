# Agnostic Query

[English](README.md) | [中文](README.zh-CN.md)

Write your query once — share it between client and server, reuse across Drizzle, Kysely, and raw SQL.

TanStack DB on the client, Drizzle on the server. The same user action — search, filter, paginate — produces `LoadSubsetOptions` on one end and needs Drizzle conditions on the other. `agnostic-query` bridges them with a portable `QuerySchema`.

**How it works:**

```
TanStack DB  ──fromTanDb──>  QuerySchema  ──toDrizzle──>  Drizzle
aq builder   ──.toJSON()──────>  QuerySchema  ──toKysely──>  Kysely
Kysely query ──fromKysely─────>  QuerySchema  ──toSql──────>  Raw SQL
```

**Runtime-agnostic** — plain data that work in clients, servers, and edge runtimes. Serialize to JSON, transmit over HTTP, consume on any platform.

**Database-agnostic** — the same `QuerySchema` drives Drizzle, Kysely, raw SQL (PostgreSQL), or any future adapter.

**Zero dependencies, tree-shakeable** — the core has no runtime dependencies; optional peer deps are only loaded when you import that adapter. Unused adapters are eliminated by your bundler.



## Fluent Builder API

Use the `aq` builder to construct a `QuerySchema` with type-safe method chaining:

```ts
import { aq } from 'agnostic-query'

interface UserShape {
  name: string
  age: number
  status: string
  role: string
}

const schema = aq<UserShape>()
  .where('name', '=', 'Alice')
  .where('age', '>=', 18)
  .where('status', 'in', ['active', 'pending'])
  .orderBy('name', 'asc')
  .limit(20)
  .offset(0)
  .toJSON()
// → {
//     where: {
//       op: 'and',
//       conditions: [
//         { field: ['name'], op: '=', value: 'Alice' },
//         { field: ['age'], op: '>=', value: 18 },
//         { field: ['status'], op: 'in', values: ['active', 'pending'] },
//       ],
//     },
//     orderBy: [{ field: ['name'], direction: 'asc' }],
//     limit: 20,
//     offset: 0,
//   }
```

### Comparison operators

| Operator | Description |
|----------|-------------|
| `=`      | eq, Exact match |
| `>`      | gt, Greater than |
| `>=`     | gte, Greater than or equal |
| `<`      | lt, Less than |
| `<=`     | lte, Less than or equal |
| `like`   | SQL `LIKE` |
| `ilike`  | Case-insensitive `LIKE` |
| `in`     | Value in array (outputs `values` field) |
| `is null`| Null check (2-argument form: `.where('field', 'is null')`) |
| `@>`     | A contains B, eg `[1, 2, 3] @> [2, 3]` |
| `<@`     | B contains A, eg `[2, 3] <@ [1, 2, 3]` |
| `&&`     | Overlap, eg `[1, 2] && [2, 3]` |

### Logical operators nesting (callbacks)

For complex logic (`and`, `or`, `not`), pass a callback to `.where()`:

```ts
const schema = aq<UserShape>()
  .where(({ or, where, not }) =>
    or([
      where('role', '=', 'admin'),
      where('role', '=', 'moderator'),
      not(where('status', '=', 'banned')),
    ]),
  )
  .toJSON()
// → {
//     where: {
//       op: 'or',
//       conditions: [
//         { field: ['role'], op: '=', value: 'admin' },
//         { field: ['role'], op: '=', value: 'moderator' },
//         { op: 'not', condition: { field: ['status'], op: '=', value: 'banned' } },
//       ],
//     },
//   }
```

### Tuple field paths

JSONB paths and array indices work the same as raw `QuerySchema`:

```ts
aq<UserShape>()
  .where(['address', 'city', 'name'], '=', 'Berlin')
  .where(['tags', 0, 'name'], 'like', '%tech%')
  .orderBy(['address', 'city', 'name'], 'desc')
```

### Raw `QueryWhere` object

Pass a pre-built `QueryWhere` directly to `.where()` — useful when reusing conditions from an existing schema or building programmatically:

```ts
const roleWhere: QuerySchema<UserShape>['where'] = {
  field: ['role'],
  op: '=',
  value: 'admin',
}

const schema = aq<UserShape>()
  .where('name', '=', 'Alice')
  .where(roleWhere)
  .toJSON()
// → {
//     where: {
//       op: 'and',
//       conditions: [
//         { field: ['name'], op: '=', value: 'Alice' },
//         { field: ['role'], op: '=', value: 'admin' },
//       ],
//     },
//   }
```

This also works inside callbacks for combining builder and raw conditions:

```ts
const schema = aq<UserShape>()
  .where(({ or, where }) =>
    or([where('name', '=', 'Alice'), where(roleWhere)]),
  )
  .toJSON()
// → {
//     where: {
//       op: 'or',
//       conditions: [
//         { field: ['name'], op: '=', value: 'Alice' },
//         { field: ['role'], op: '=', value: 'admin' },
//       ],
//     },
//   }
```

### Chaining `.orderBy()`

Multiple `.orderBy()` calls append entries:

```ts
aq<UserShape>()
  .orderBy('name', 'asc')
  .orderBy('age', 'desc')
  .toJSON()
// → {
//     orderBy: [
//       { field: ['name'], direction: 'asc' },
//       { field: ['age'], direction: 'desc' },
//     ],
//   }
```

## Type System

### Field path safety

```ts
interface User {
  name: string
  age: number
  tags: { id: number; name: string }[]
  address: { city: { name: string } }
}

aq<User>().where(['tags', 0, 'name'], '=', 'tech')         // ✓
aq<User>().where(['tags', 0, 'name'], '=', 42)              // ✗ string ≠ number
aq<User>().where(['address', 'city', 'name'], '=', 'Berlin') // ✓
aq<User>().where(['address', 'city', 'zip'], '=', '12345')   // ✗ no 'zip' on city
```

## Usage

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

### Import paths

```ts
// Core types & builder
import { aq, QuerySchema, QueryWhere, QueryOrderBy, findWhere, newComparisonWhere, newWhere } from 'agnostic-query'

// Zod validation
import { createWhereSchema } from 'agnostic-query/zod'

// Valibot validation
import { createWhereSchema } from 'agnostic-query/valibot'

// Drizzle adapter — apply where to Drizzle query
import { toDrizzle, toDrizzleWhere, toDrizzleOrderBy } from 'agnostic-query/drizzle/pg'

// db0 adapter — execute schema as parameterised SQL via db0
import { toDb0 } from 'agnostic-query/db0/pg'

// TanStack DB adapter — parse TanStack expression into QueryWhere
import { fromTanDbWhere, fromTanDbOrderBy } from 'agnostic-query/tanstack-db'

// Kysely adapter — bidirectional
import { fromKysely, toKyselyWhere, toKyselyOrderBy } from 'agnostic-query/kysely/pg'

// SQL adapter — parameterised SQL generation
import { toSql, toSqlWhere, toSqlOrderBy } from 'agnostic-query/sql/pg'
```

## Core Utilities

### Raw schema (without builder)

You can also construct `QuerySchema` as a plain object directly:

```ts
import type { QuerySchema } from 'agnostic-query'

interface UserShape {
  name: string
  age: number
  status: string
}

const schema: QuerySchema<UserShape> = {
  limit: 20,
  offset: 0,
  orderBy: [{ field: ['name'], direction: 'asc' }],
  where: {
    op: 'and',
    conditions: [
      { field: ['age'], op: '>=', value: 18 },
      { field: ['status'], op: 'in', values: ['active', 'pending'] },
    ],
  },
}
```

### findWhere: search within a WHERE tree

Extract a specific condition from a complex nested WHERE tree:

```ts
import { findWhere } from 'agnostic-query'

const where = {
  op: 'and',
  conditions: [
    { field: ['name'], op: '=', value: 'Alice' },
    {
      op: 'or',
      conditions: [
        { field: ['age'], op: '<', value: 30 },
        { field: ['role'], op: '=', value: 'admin' },
      ],
    },
  ],
}

const searcher = findWhere(where)

searcher.find(['age'])            // { field: ['age'], op: '<', value: 30 }
searcher.find(['role'], '=')     // { field: ['role'], op: '=', value: 'admin' }
searcher.eq(['name'])             // { field: ['name'], op: '=', value: 'Alice' }
searcher.in(['role'])             // undefined
```

### newComparisonWhere: build a ComparisonWhere

Create a reusable `ComparisonWhere` object with full type inference:

```ts
import { newComparisonWhere } from 'agnostic-query'

interface User {
  name: string
  age: number
  status: string
  tags: { id: number; name: string }[]
}

const nameEq = newComparisonWhere<User>()('name', '=', 'Alice')
// → { field: ['name'], op: '=', value: 'Alice' }

const statusIn = newComparisonWhere<User>()('status', 'in', ['active', 'pending'])
// → { field: ['status'], op: 'in', values: ['active', 'pending'] }

const tagName = newComparisonWhere<User>()(['tags', 0, 'name'], 'like', '%tech%')
// → { field: ['tags', 0, 'name'], op: 'like', value: '%tech%' }
```

Pass the result directly to `.where()` on a builder or inside a callback:

```ts
const filter = aq<User>()
  .where(nameEq)
  .where(statusIn)
  .toJSON()
```

### newWhere: where-only builder

Build a `QueryWhere` independently of a full `QuerySchema` — useful when you want to construct, compose, and reuse where conditions in isolation:

```ts
import { newWhere } from 'agnostic-query'

const w = newWhere<User>()
  .where('name', '=', 'Alice')
  .where('age', '>=', 18)
  .toJSON()
// → {
//     op: 'and',
//     conditions: [
//       { field: ['name'], op: '=', value: 'Alice' },
//       { field: ['age'], op: '>=', value: 18 },
//     ],
//   }
```

Accepts an initial `QueryWhere` to extend, with all the same overloads as `aq().where()`:

```ts
const base = newWhere<User>({ field: ['status'], op: '=', value: 'active' })

const full = base
  .where(({ or, and, where }) =>
    or([
      and([where('role', '=', 'admin'), where('age', '>=', 18)]),
      where('role', '=', 'moderator'),
    ]),
  )
  .toJSON()
```

Pass the result directly into `QuerySchema` or another `newWhere`:

```ts
const schema: QuerySchema<User> = {
  limit: 20,
  where: newWhere<User>()
    .where(fromTanDbWhere(where))
    .where(fromTanDbWhere(cursor?.whereFrom))
    .toJSON(),
  orderBy: fromTanDbOrderBy(orderBy),
}
```

### Complex field paths (JSONB / arrays)

```ts
// JSONB nested field → "address"->'city'->>'name' = ?
{ field: ['address', 'city', 'name'], op: '=', value: 'Berlin' }

// PG array element → "category"[1] = ?
{ field: ['category', 0], op: '=', value: 'electronics' }

// Nested array of objects → "tags"->0->>'name' LIKE ?
{ field: ['tags', 0, 'name'], op: 'like', value: '%tech%' }
```

All paths are fully type-checked against your shape.

## Adapter: Raw SQL (PostgreSQL)

```ts
import { toSql } from 'agnostic-query/sql/pg'

const { sql, params } = toSql({
  table: 'users',
  ...schema,
})!
// → sql:    SELECT * FROM "users" WHERE "age" >= ? AND "status" IN (?, ?) ORDER BY "name" ASC LIMIT 20 OFFSET 0
// → params: [18, 'active', 'pending']
```

Or compose the parts yourself using `toSqlWhere` / `toSqlOrderBy` for partial queries. Pass the resulting `{ sql, params }` to any driver that supports parameterised queries (node-postgres, postgres.js, db0, Bun, etc.).

## Adapter: Kysely

### Extract schema from a Kysely query

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
// → {
//     limit: 20,
//     orderBy: [{ field: ['name'], direction: 'asc' }],
//     where: { op: 'and', conditions: [...] },
//   }

JSON.stringify(schema) // send to client
```

### Apply schema to a Kysely query

```ts
import { toKyselyWhere, toKyselyOrderBy } from 'agnostic-query/kysely/pg'

let query = db.selectFrom('user').selectAll()

if (schema.where)   query = query.where(toKyselyWhere(schema.where))
if (schema.orderBy) query = toKyselyOrderBy(query, schema.orderBy)
if (schema.limit)   query = query.limit(schema.limit)
if (schema.offset)  query = query.offset(schema.offset)

const users = await query.execute()
```

## Adapter: Drizzle

One-shot: build and execute the full query with `toDrizzle`:

```ts
import { toDrizzle } from 'agnostic-query/drizzle/pg'

const rows = await toDrizzle<User>(db, userTable, data)
```

Or compose manually for more control:

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

## End-to-end: aq → QuerySchema → HTTP → Drizzle

Client code builds a query with the `aq` builder, serializes the `QuerySchema`, sends it to a server function, then executes via db0 with full type safety.

**Client** (shared type from `#/features/project/project.schema`)

```ts
import { aq } from 'agnostic-query'
import type { Project } from '#/features/project/project.schema.ts'

const schema = aq<Project>({ table: 'project' })
  .where('age', '>=', 18)
  .where('status', 'in', ['active', 'pending'])
  .orderBy('name', 'asc')
  .limit(20)
  .toJSON()

const projects = await listProject({ data: schema })
```

**Server**

Because `QuerySchema` is plain data, you can inject access control conditions before executing:

```ts
import { aq } from 'agnostic-query'
import { toDrizzle } from 'agnostic-query/drizzle/pg'
import { getCurrentUser } from '#/features/auth/auth.fn.ts'

export const listProject = createServerFn({ method: 'GET' })
  .handler(async ({ data }) => {
    const { userId } = getCurrentUser()

    // Inject tenant isolation — reuse aq builder with existing schema
    const enriched = aq(data).where('user_id', '=', userId).toJSON()

    return await toDrizzle(db, projectTable, data)
  })
```
## End-to-end: TanStack DB + agnostic-query

Full-stack infinite query from the [`examples/tanstack-db`](examples/tanstack-db) project. TanStack DB collection translates its internal WHERE/ORDER BY into `QuerySchema`, which is sent to a server function and executed via Drizzle.

**Table schema** (`project.table.ts`)

```ts
import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { timeIdWithTimestamps } from '#/db/helpers.ts'

export const projectTable = pgTable('project', (t) => ({
  ...timeIdWithTimestamps,
  order: integer().default(0),
  name: text().notNull(),
}))
```

**Drizzle-Zod schema** (`project.schmea.ts`)

```ts
import { createSelectSchema } from 'drizzle-zod'
import { projectTable } from './project.table.ts'

export const projectSchema = createSelectSchema(projectTable)
export type Project = typeof projectTable.$inferSelect
```

**Server function** (`project.fn.ts`) — validates incoming `QuerySchema` with Zod, executes via `toDrizzle`

```ts
import { createServerFn } from '@tanstack/react-start'
import { toDrizzle } from 'agnostic-query/drizzle/pg'
import { createQuerySchema } from 'agnostic-query/zod'
import { db } from '#/db/index.ts'
import type { Project } from '#/features/project/project.schmea.ts'
import { projectTable } from '#/features/project/project.table.ts'

export const listProject = createServerFn()
  .inputValidator(createQuerySchema<Project>())
  .handler(async ({ data }) => {
    return await toDrizzle(db, projectTable, data)
  })
```

**Client collection** (`project.sync.ts`) — translates TanStack DB metadata into `QuerySchema` using `fromTanDbWhere` / `fromTanDbOrderBy`, then calls the server function

```ts
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import {
  BasicIndex,
  createCollection,
  type InitialQueryBuilder,
} from '@tanstack/db'
import { aq, newWhere, type QuerySchema } from 'agnostic-query/index'
import { fromTanDbOrderBy, fromTanDbWhere } from 'agnostic-query/tanstack-db'
import { listProject } from '#/features/project/project.fn.ts'
import {
  type Project,
  projectSchema,
} from '#/features/project/project.schmea.ts'
import { getQueryClient } from '#/integrations/tanstack-query/provider'

export const projectCollect = createCollection(
  queryCollectionOptions({
    queryKey: ['project'],
    queryClient: getQueryClient(),
    schema: projectSchema,
    syncMode: 'on-demand',
    autoIndex: 'eager',
    defaultIndexType: BasicIndex,
    queryFn: async ({ meta }) => {
      const { where, limit, orderBy, cursor } =
        meta?.loadSubsetOptions ?? {}
      const data = {
        limit,
        where: newWhere(fromTanDbWhere(where))
          .where(fromTanDbWhere(cursor?.whereFrom))
          .toJSON(),
        orderBy: fromTanDbOrderBy(orderBy),
      }
      return await listProject({ data })
    },
    getKey: (item) => item.id,
  }),
)

export const infiniteProjectQuery = (q: InitialQueryBuilder) =>
  q.from({ p: projectCollect }).orderBy(({ p }) => p.created_at, 'desc')
```

**Route** (`projects.tsx`) — React component with infinite scroll using `useLiveInfiniteQuery`

```tsx
import { useLiveInfiniteQuery } from '@tanstack/db'
import { createFileRoute } from '@tanstack/react-router'
import { infiniteProjectQuery } from '#/features/project/project.sync.ts'

export const Route = createFileRoute('/projects')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLiveInfiniteQuery(infiniteProjectQuery, { pageSize: 10 })

  return (
    <div>
      {data?.map((p) => (
        <div key={p.id}>
          <h2>{p.name}</h2>
          <p>{p.created_at?.toLocaleString()}</p>
        </div>
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

### Data Flow

```mermaid
flowchart LR
    subgraph Input["Build"]
        aq_builder["Agnostic Query"]
        manual[Manual / Raw Object]
        tanstack_expr[TanStack DB]
        kysely_ast[Kysely Query]
    end

    subgraph Core["Core"]
        qs[QuerySchema]
    end

    subgraph Validate["Optional Validation"]
        zod[Zod]
        valibot[Valibot]
    end

    subgraph Output["Output"]
        drizzle["toDrizzleWhere<br/>toDrizzleOrderBy"]
        kysely_out["toKyselyWhere<br/>toKyselyOrderBy"]
        sql_out["toSqlWhere<br/>toSqlOrderBy"]
    end

    aq_builder -->|.toJSON| qs
    manual --> qs
    tanstack_expr --> tanparse[fromTanDbWhere] --> qs
    kysely_ast --> kysely_parse[fromKysely] --> qs
    qs --> zod
    qs --> valibot
    qs -- where/orderBy --> drizzle
    qs -- where/orderBy --> kysely_out
    qs -- where/orderBy --> sql_out
```


## Toolchain

- Package manager: **bun** (workspaces)
- Type checking: **tsgo** (TypeScript Go / TS 7.0 preview)
- Validation: **zod v4** / **valibot v1**

## Examples

```bash
cd examples/with-drizzle
bun start
```

```bash
cd examples/with-kysely
bun start
```
