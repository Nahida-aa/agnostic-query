---
name: query
description: >
  Build a portable QuerySchema with the aq builder. Typesafe where/orderBy/limit/offset,
  logical nesting (and/or/not) via callbacks, standalone newWhere/newComparisonWhere
  builders, and Zod/Valibot runtime validation with createQuerySchema.
type: core
library: agnostic-query
library_version: '1.7.0'
sources:
  - 'Nahida-aa/agnostic-query:packages/agnostic-query/src/core/index.ts'
  - 'Nahida-aa/agnostic-query:packages/agnostic-query/src/core/where.ts'
  - 'Nahida-aa/agnostic-query:packages/agnostic-query/src/core/order-by.ts'
  - 'Nahida-aa/agnostic-query:docs/src/content/docs/guides/builder.md'
  - 'Nahida-aa/agnostic-query:docs/src/content/docs/guides/where.md'
---

# agnostic-query — Build a Query

## Setup

```ts
import { aq, newWhere, newComparisonWhere } from 'agnostic-query'

interface User {
  name: string
  age: number
  status: string
  id: number
}
```

## Core Patterns

### Build a query with where, orderBy, limit, offset

```ts
const schema = aq<User>()
  .where('name', 'eq', 'Alice')
  .where('age', 'gte', 18)
  .orderBy('name', 'asc')
  .limit(20)
  .offset(0)
  .toJSON()
```

Each `.where()` call auto-merges with the previous one using `AND`. The builder is immutable — every method returns a new instance.

### Nest conditions with and/or/not

Use the callback overload for logical grouping:

```ts
const schema = aq<User>()
  .where((eb) =>
    eb.and([
      eb.where('age', 'gte', 18),
      eb.or([
        eb.where('status', 'eq', 'active'),
        eb.where('status', 'eq', 'premium'),
      ]),
    ]),
  )
  .toJSON()
```

`and()`, `or()`, and `not()` are available on the expression builder (`eb`). `eb.where()` can also accept a raw `ComparisonWhere` object created by `newComparisonWhere`.

### Use standalone WHERE builders

`newWhere` accumulates conditions without a full `aq` builder:

```ts
const w = newWhere<User>()
  .where('name', 'eq', 'Alice')
  .where('age', 'gte', 18)
  .toJSON()
// → { op: 'and', conditions: [...] }
```

`newComparisonWhere` creates a single comparison:

```ts
const cw = newComparisonWhere<User>()('name', 'eq', 'Alice')
// → { field: ['name'], op: 'eq', value: 'Alice' }
```

### Validate a QuerySchema at runtime

```ts
import { createQuerySchema } from 'agnostic-query/zod'

const schema = aq<User>().where('name', 'eq', 'Alice').toJSON()
const parsed = createQuerySchema<User>().parse(schema)
// throws if schema is malformed
```

Also available from `agnostic-query/valibot`.

### Pass raw QueryWhere objects

`.where()` accepts a raw `QueryWhere<T>` object for cases where conditions are built dynamically:

```ts
const dynamicWhere: QueryWhere<User> = { field: ['name'], op: 'eq', value: 'Bob' }
const schema = aq<User>().where(dynamicWhere).toJSON()
```

## Common Mistakes

### HIGH Constructing QueryWhere objects directly

Wrong — bypasses TypeScript field path validation:

```ts
const schema: QuerySchema<User> = {
  where: { field: ['name'], op: 'eq', value: 'Alice' },
}
```

Correct — use the builder:

```ts
const schema = aq<User>().where('name', 'eq', 'Alice').toJSON()
```

TypeScript validates that `'name'` is a valid field on `User` and `'Alice'` has the correct type (`string`).

Source: maintainer interview

---

See also: agnostic-query/adapters — a constructed QuerySchema is nearly always consumed by an adapter
