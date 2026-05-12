---
"agnostic-query": minor
---

feat!: replace `eq`/`gt`/`gte`/`lt`/`lte` with SQL symbols `=`/`>`/`>=`/`<`/`<=`; add `is null`, `@>`, `<@`, `&&` operators

### Operator rename
- `UnaryComparisonOp`: `eq`→`=`, `gt`→`>`, `gte`→`>=`, `lt`→`<`, `lte`→`<=`
- SQL symbols match PostgreSQL conventions, no mapping table needed in adapters
- `sqlOpMap` removed — ops are passed directly to SQL output (uppercased for SQL convention)

### New operators
- **`is null`**: `PredicateOp` — no value field, 2-argument form `.where('field', 'is null')`
- **`@>`**: contains (array/JSONB superset), **`<@`**: contained by, **`&&`**: overlaps
- All four work in all adapters: SQL, Drizzle, Kysely, db0
- Zod schema updated with `predicateSchema` and `setComparisonSchema`

### Type safety
- `ComparisonWhereValue` returns `never` for `PredicateOp` — 3-argument form `.where('f', 'is null', x)` now errors at compile time
- `in` operator banned on array fields at type level with clear error message
- Added compile-time type tests (`where.test-d.ts`) — 25+ assertions covering all operator branches
