---
title: WHERE System
description: Learn the complete WHERE API — comparisons, logical nesting, and standalone builders.
---

agnostic-query provides a comprehensive WHERE system that covers simple comparisons, complex logical nesting, raw objects, and standalone builders.

## Comparison WHERE

The simplest form — a field, an operator, and a value:

```ts
aq<User>().where('name', 'eq', 'Alice')
aq<User>().where('age', 'gte', 18)
aq<User>().where('status', 'in', ['active', 'pending'])
```

## Logical Nesting

Use callbacks for `and`, `or`, and `not`:

```ts
aq<User>()
  .where(({ or, and, where, not }) =>
    or([
      and([
        where('role', 'eq', 'admin'),
        where('age', 'gte', 18),
      ]),
      where('role', 'eq', 'moderator'),
      not(where('status', 'eq', 'banned')),
    ]),
  )
  .toJSON()
```

The callbacks return `WhereExpr` which supports arbitrary nesting depth.

## Raw QueryWhere Object

Pass a pre-built `QueryWhere` object:

```ts
const roleWhere: QuerySchema<User>['where'] = {
  field: ['role'],
  op: 'eq',
  value: 'admin',
}

aq<User>().where('name', 'eq', 'Alice').where(roleWhere).toJSON()
```

## newWhere: Standalone WHERE Builder

Build a `QueryWhere` independently of a full `QuerySchema`:

```ts
import { newWhere } from 'agnostic-query'

const w = newWhere<User>()
  .where('name', 'eq', 'Alice')
  .where('age', 'gte', 18)
  .toJSON()
// → {
//     op: 'and',
//     conditions: [
//       { field: ['name'], op: 'eq', value: 'Alice' },
//       { field: ['age'], op: 'gte', value: 18 },
//     ],
//   }
```

Accepts an initial `QueryWhere` to extend:

```ts
const base = newWhere<User>({ field: ['status'], op: 'eq', value: 'active' })

const full = base
  .where(({ or, and, where }) =>
    or([
      and([where('role', 'eq', 'admin'), where('age', 'gte', 18)]),
      where('role', 'eq', 'moderator'),
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

## newComparisonWhere

Create a reusable `ComparisonWhere` object with full type inference:

```ts
import { newComparisonWhere } from 'agnostic-query'

const nameEq = newComparisonWhere<User>()('name', 'eq', 'Alice')
const statusIn = newComparisonWhere<User>()('status', 'in', ['active', 'pending'])
const tagName = newComparisonWhere<User>()(['tags', 0, 'name'], 'like', '%tech%')
```

Pass the result directly to `.where()`:

```ts
aq<User>()
  .where(nameEq)
  .where(statusIn)
  .toJSON()
```

## findWhere: Search in a WHERE Tree

Extract a specific condition from a complex nested WHERE tree:

```ts
import { findWhere } from 'agnostic-query'

const where = {
  op: 'and',
  conditions: [
    { field: ['name'], op: 'eq', value: 'Alice' },
    {
      op: 'or',
      conditions: [
        { field: ['age'], op: 'lt', value: 30 },
        { field: ['role'], op: 'eq', value: 'admin' },
      ],
    },
  ],
}

const searcher = findWhere(where)

searcher.find(['age'])            // { field: ['age'], op: 'lt', value: 30 }
searcher.find(['role'], 'eq')     // { field: ['role'], op: 'eq', value: 'admin' }
searcher.eq(['name'])             // { field: ['name'], op: 'eq', value: 'Alice' }
searcher.in(['role'])             // undefined
```
