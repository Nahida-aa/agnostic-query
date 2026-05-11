---
title: API Reference
description: Complete API reference for agnostic-query.
---

All generic types accept either `interface` or `type` as the shape parameter — both work identically.

## Core Types

### QuerySchema

The portable query model. Can be constructed via the `aq` builder or as a plain object.

```ts
interface QuerySchema<TShape extends SchemaShape = SchemaShape> {
  where?: QueryWhere<TShape> | null
  orderBy?: QueryOrderBy<TShape>[]
  limit?: number
  offset?: number
  mate?: Record<string, any>
  table?: string
}
```

### QueryWhere

Represents a single condition or logical combination.

```ts
type QueryWhere<TShape> =
  | ComparisonWhere<TShape>
  | CompoundWhere<TShape>
  | UnaryLogicalWhere<TShape>
```

### ComparisonWhere

A single field comparison.

```ts
interface ComparisonWhere<TShape> {
  field: FieldPathByShape<TShape>
  op: WhereComparisonOp
  value?: unknown
  values?: unknown[]
}
```

### CompoundWhere

Logical combination (`and` / `or`).

```ts
interface CompoundWhere<TShape> {
  op: 'and' | 'or'
  conditions: QueryWhere<TShape>[]
}
```

### UnaryLogicalWhere

Negation (`not`).

```ts
interface UnaryLogicalWhere<TShape> {
  op: 'not'
  condition: QueryWhere<TShape>
}
```

### QueryOrderBy

```ts
interface QueryOrderBy<TShape> {
  field: FieldPathByShape<TShape>
  direction?: 'asc' | 'desc'
}
```

## Functions

### aq

Create a new `QuerySchema` builder.

```ts
aq<TShape>(state?: QuerySchema<TShape>): AgnosticQuery<TShape>
```

### newWhere

Create a standalone WHERE builder.

```ts
newWhere<TShape>(state?: QueryWhere<TShape> | null): NewWhere<TShape>
```

### newComparisonWhere

Create a reusable `ComparisonWhere` factory.

```ts
newComparisonWhere<TShape>(): <Col, Op>(col, op, value) => ComparisonWhere<TShape>
```

### findWhere

Create a WHERE tree searcher.

```ts
findWhere<TShape>(where: QueryWhere<TShape>): WhereSearcher<TShape>
```

### createExpr

Create a `WhereExpr` for use in callbacks. Used internally by `.where(callback)`.

```ts
createExpr<TShape>(): WhereExpr<TShape>
```

## Adapter Functions

### Drizzle

```ts
toDrizzle<T>(db, table, data: QuerySchema<T>): Promise<T[]>
toDrizzleWhere<T>(table, where?: QueryWhere<T>): SQL | undefined
toDrizzleOrderBy<T>(table, orderBy?: QueryOrderBy<T>[]): SQL[]
```

### Raw SQL (PostgreSQL)

```ts
toSql(options: { table: string } & QuerySchema): SqlResult | undefined
toSqlWhere(where?: QueryWhere): string
toSqlOrderBy(orderBy?: QueryOrderBy[]): string
```

### Kysely

```ts
fromKysely<T>(query: SelectQueryBuilder): QuerySchema<T>
toKyselyWhere<T>(where: QueryWhere<T>): ExpressionOrFactory<...>
toKyselyOrderBy<T>(query: SelectQueryBuilder, orderBy: QueryOrderBy<T>[]): SelectQueryBuilder
```

### TanStack DB

```ts
fromTanDbWhere(where: unknown): QueryWhere | undefined
fromTanDbOrderBy(orderBy: unknown): QueryOrderBy[]
```

### db0

```ts
query<T>(db: Database, data: QuerySchema<T>): Promise<T[]>
```

### Zod / Valibot

```ts
createQuerySchema<TShape>(): ZodSchema<QuerySchema<TShape>>
```
