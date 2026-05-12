---
title: Builder API
description: Use the aq builder to construct QuerySchema objects with type-safe method chaining.
---

The `aq` builder provides a fluent API for constructing `QuerySchema` objects.

Both `interface` and `type` work as the shape parameter — use whichever you prefer.

## Basic Usage

```ts
import { aq } from 'agnostic-query'

interface User {
  name: string
  age: number
  status: string
}

const schema = aq<User>()
  .where('name', '=', 'Alice')
  .where('age', '>=', 18)
  .orderBy('name', 'asc')
  .limit(20)
  .offset(0)
  .toJSON()
```

## Comparison Operators

| Operator | Description |
|----------|-------------|
| `=`      | Exact match |
| `>`      | Greater than |
| `>=`     | Greater than or equal |
| `<`      | Less than |
| `<=`     | Less than or equal |
| `like`   | SQL `LIKE` |
| `ilike`  | Case-insensitive `LIKE` |
| `in`     | Value in array (outputs `values` field) |
| `is null`| Null check (2-argument form: `.where('field', 'is null')`) |
| `@>`     | Array contains (PostgreSQL) |
| `<@`     | Array contained by (PostgreSQL) |
| `&&`     | Array overlaps (PostgreSQL) |

## Logical Nesting (callbacks)

For complex logic (`and`, `or`, `not`), pass a callback to `.where()`:

```ts
const schema = aq<User>()
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

## Raw QueryWhere Object

Pass a pre-built `QueryWhere` directly to `.where()`:

```ts
const roleWhere: QuerySchema<User>['where'] = {
  field: ['role'],
  op: '=',
  value: 'admin',
}

const schema = aq<User>()
  .where('name', '=', 'Alice')
  .where(roleWhere)
  .toJSON()
```

This also works inside callbacks:

```ts
aq<User>()
  .where(({ or, where }) =>
    or([where('name', '=', 'Alice'), where(roleWhere)]),
  )
  .toJSON()
```

## Tuple Field Paths

JSONB paths and array indices work with tuple syntax:

```ts
aq<User>()
  .where(['address', 'city', 'name'], '=', 'Berlin')
  .where(['tags', 0, 'name'], 'like', '%tech%')
  .orderBy(['address', 'city', 'name'], 'desc')
```

## Chaining `.orderBy()`

Multiple `.orderBy()` calls append entries:

```ts
aq<User>()
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

## Type Safety

Field paths are fully type-checked against your shape:

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

## Raw Schema (without builder)

You can also construct `QuerySchema` as a plain object:

```ts
import type { QuerySchema } from 'agnostic-query'

const schema: QuerySchema<User> = {
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
