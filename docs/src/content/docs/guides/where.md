---
title: WHERE System
description: Learn the complete WHERE API — comparisons, logical nesting, and standalone builders.
---

agnostic-query provides a comprehensive WHERE system that covers simple comparisons, complex logical nesting, raw objects, and standalone builders.

## Comparison WHERE

The simplest form — a field, an operator, and a value:

```ts
aq<User>().where('name', '=', 'Alice')
aq<User>().where('age', '>=', 18)
aq<User>().where('status', 'in', ['active', 'pending'])
aq<User>().where('name', 'is null')        // 2-argument form (no value)
aq<User>().where('tags', '@>', ['admin'])  // array contains
aq<User>().where('tags', '<@', ['admin'])  // array contained by
aq<User>().where('tags', '&&', ['admin'])  // array overlaps
```

## Logical Nesting

Use callbacks for `and`, `or`, and `not`:

```ts
aq<User>()
  .where(({ or, and, where, not }) =>
    or([
      and([
        where('role', '=', 'admin'),
        where('age', '>=', 18),
      ]),
      where('role', '=', 'moderator'),
      not(where('status', '=', 'banned')),
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
  op: '=',
  value: 'admin',
}

aq<User>().where('name', '=', 'Alice').where(roleWhere).toJSON()
```

## newWhere: Standalone WHERE Builder

Build a `QueryWhere` independently of a full `QuerySchema`:

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

Accepts an initial `QueryWhere` to extend:

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

## newComparisonWhere

Create a reusable `ComparisonWhere` object with full type inference:

```ts
import { newComparisonWhere } from 'agnostic-query'

const nameEq = newComparisonWhere<User>()('name', '=', 'Alice')
const statusIn = newComparisonWhere<User>()('status', 'in', ['active', 'pending'])
const tagName = newComparisonWhere<User>()(['tags', 0, 'name'], 'like', '%tech%')
const nameIsNull = newComparisonWhere<User>()('name', 'is null')
const tagsContain = newComparisonWhere<User>()('tags', '@>', ['admin'])
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
searcher.find(['role'], '=')      // { field: ['role'], op: '=', value: 'admin' }
searcher.eq(['name'])             // { field: ['name'], op: '=', value: 'Alice' }
searcher.in(['role'])             // undefined
```
