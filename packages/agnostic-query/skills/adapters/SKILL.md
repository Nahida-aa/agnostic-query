---
name: adapters
description: >
  Convert a portable QuerySchema to/from Drizzle, Kysely, TanStack DB, db0, or raw
  SQL. Tree-shakeable adapters — only import what you need. Covers toDrizzle,
  fromTanDb, fromKysely, toKysely, toDb0, and toSql.
type: core
library: agnostic-query
library_version: '1.7.0'
sources:
  - 'Nahida-aa/agnostic-query:docs/src/content/docs/guides/adapters.md'
  - 'Nahida-aa/agnostic-query:docs/src/content/docs/guides/e2e.md'
  - 'Nahida-aa/agnostic-query:packages/agnostic-query/src/drizzle/pg.ts'
  - 'Nahida-aa/agnostic-query:packages/agnostic-query/src/kysely/pg.ts'
  - 'Nahida-aa/agnostic-query:packages/agnostic-query/src/tanstack-db.ts'
  - 'Nahida-aa/agnostic-query:packages/agnostic-query/src/db0/pg.ts'
  - 'Nahida-aa/agnostic-query:packages/agnostic-query/src/sql/pg.ts'
---

# agnostic-query — Translate Between ORMs

All adapter dependencies (`drizzle-orm`, `kysely`, `@tanstack/db`, `db0`, `zod`, `valibot`) are **optional peer dependencies** — install only what you use.

## Setup

```ts
import { toDrizzle, toDrizzleWhere, toDrizzleOrderBy } from 'agnostic-query/drizzle/pg'
import { fromTanDb, fromTanDbWhere, fromTanDbOrderBy } from 'agnostic-query/tanstack-db'
import { fromKysely, toKyselyWhere, toKyselyOrderBy } from 'agnostic-query/kysely/pg'
import { toDb0, toDb0Where, toDb0OrderBy } from 'agnostic-query/db0/pg'
import { toSql, toSqlWhere, toSqlOrderBy } from 'agnostic-query/sql/pg'
```

## Core Patterns

### Execute a QuerySchema via Drizzle

```ts
import { toDrizzle } from 'agnostic-query/drizzle/pg'
import { db, users } from './db.ts'

const schema = aq<User>()
  .where('name', 'eq', 'Alice')
  .where('age', 'gte', 18)
  .toJSON()

const rows = await toDrizzle(db, users, schema)
```

`toDrizzleWhere` and `toDrizzleOrderBy` are also available for custom Drizzle queries.

Note on SQLite and Postgres-specific ops:

- `ilike` is not a native SQLite operator; the SQLite adapter emulates it as `LOWER(col) LIKE LOWER(?)` which provides case-insensitive matching but may have different performance characteristics compared to Postgres `ILIKE`.
- Postgres array/set operators (`@>`, `<@`, `&&`) are not directly supported in SQLite. If you store arrays as JSON in SQLite you can emulate some behaviors using `json_each`/`json_extract` or multiple `EXISTS` checks, but these are more complex and typically slower than Postgres native array ops. For production workloads that rely heavily on array/set operators, prefer Postgres or implement server-side emulation with awareness of performance trade-offs.

### Translate from TanStack DB

`fromTanDb` handles where, cursor, limit, and orderBy from `LoadSubsetOptions` in one call:

```ts
import { fromTanDb } from 'agnostic-query/tanstack-db'

// Inside a server function / queryFn
const data = fromTanDb(meta?.loadSubsetOptions)
// → QuerySchema
```

Lower-level: `fromTanDbWhere` and `fromTanDbOrderBy` for manual control.

### Translate from Kysely

```ts
import { fromKysely } from 'agnostic-query/kysely/pg'
import { db } from './db.ts'

const query = db.selectFrom('users').selectAll().where('age', '>=', 18)
const schema = fromKysely<User>(query)
// converts the Kysely query into a portable QuerySchema
```

### Execute via db0

```ts
import { toDb0 } from 'agnostic-query/db0/pg'

const rows = await toDb0<User>(db, schema)
```

Lower-level: `toDb0Where` and `toDb0OrderBy` for building raw SQL clauses.

### Generate raw SQL strings

```ts
import { toSql } from 'agnostic-query/sql/pg'

const result = toSql({ table: 'users', ...schema })
// → { sql: 'SELECT * FROM "users" WHERE ...', params: [...] }
```

Also: `toSqlWhere`, `toSqlOrderBy` for individual clause generation.

## Common Mistakes

### MEDIUM Assuming adapter dependencies are installed

Wrong — importing an adapter without its optional peer dep:

```ts
import { toDrizzle } from 'agnostic-query/drizzle/pg'
// Error: Cannot find module 'drizzle-orm'
```

Correct — install the adapter's peer dep first:

```sh
bun add drizzle-orm
```

All peer dependencies are optional. See `package.json` `peerDependenciesMeta` for the full list.

Source: package.json peerDependenciesMeta

---

See also: agnostic-query/query — understanding QuerySchema structure helps debug unexpected conversions
