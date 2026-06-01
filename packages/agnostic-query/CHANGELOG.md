# agnostic-query

## 1.10.5

### Patch Changes

- [`332c2d9`](https://github.com/Nahida-aa/agnostic-query/commit/332c2d95ea604595c22e07177138dfd5663ac1a9) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - Fix type assertion in findValueInWhere and update core types

## 1.10.4

### Patch Changes

- [`a582f82`](https://github.com/Nahida-aa/agnostic-query/commit/a582f82422dbce6ae0230cb5cbd4aaab3e675c1c) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - fix: widen peerDependencies for broader compatibility (`zod ^4.0.0`, others `*`)

## 1.10.3

### Patch Changes

- [`9fb8f9d`](https://github.com/Nahida-aa/agnostic-query/commit/9fb8f9d91987c177b086543cd5038d19920f67c7) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - fix: replace non-portable `./*`/`./*/*` exports with `"./"` directory pattern for broader compatibility
  chore: remove unused `@tanstack/query-db-collection` devDependency

## 1.10.2

### Patch Changes

- [`9a56ca8`](https://github.com/Nahida-aa/agnostic-query/commit/9a56ca8750befea949c3da141616e8be059c7918) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - fix: perl replacement in build script drops closing quote due to bash `$1` expansion
  ci: only run PR workflow, build before tsd

## 1.10.1

### Patch Changes

- [`b7cff5c`](https://github.com/Nahida-aa/agnostic-query/commit/b7cff5c8d500e8c49b6409ed5028fe99ff54d62e) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - fix: drizzle/sqlite.ts imports fieldToStr from sql/pg.ts instead of sql/sqlite.ts
  feat: add db0/sqlite adapter for SQLite-flavored SQL via db0-compatible drivers
  feat: extract Db type to db0/types.ts for reuse
  fix: refactor type tests to use @ts-expect-error without expectError wrapper
  docs: update README and docs with db0 adapter documentation and SQLite variant

- [`0a34f56`](https://github.com/Nahida-aa/agnostic-query/commit/0a34f56d17cfc8d3b732bab4df3070f7ba869874) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - fix: restore exports to dist for published package

## 1.10.0

### Minor Changes

- [`2dcd79a`](https://github.com/Nahida-aa/agnostic-query/commit/2dcd79a29418414f20d75c0394f314da4b24ff9f) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - Normalize empty TanStack DB order-by output in the final schema and add in-memory SQLite coverage for db0 and TanStack DB adapters.

- [`db5a1ac`](https://github.com/Nahida-aa/agnostic-query/commit/db5a1ac4c7a85ed767017ae81dbe810f588aaa6f) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - Ship compiled dist exports for subpath entrypoints, add a build step to prepublish, and align db0 query types so `all()` supports both async and sync result providers.

### Patch Changes

- [`b4d8597`](https://github.com/Nahida-aa/agnostic-query/commit/b4d8597b58b81ad33ac3fa514120d8268bd60ff9) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - Include the source type entry in the published files list so `tsd` can resolve the package type definition.

## 1.9.11

### Patch Changes

- [`0b80fad`](https://github.com/Nahida-aa/agnostic-query/commit/0b80fad87101658f251327fb5a89e5cbae266a26) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - Tighten db0 adapter type signatures and keep the internal Db interface aligned with the current Promise-based result shape.

## 1.9.10

### Patch Changes

- [`368a2f9`](https://github.com/Nahida-aa/agnostic-query/commit/368a2f9b5e696b60d68cbe485bfb9d886ceab836) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - Refine db0 adapter imports and package metadata by removing the package-level path alias, using local Db types, and dropping the unused @tanstack/query-db-collection dependency entry.

## 1.9.9

### Patch Changes

- [`68e1699`](https://github.com/Nahida-aa/agnostic-query/commit/68e16999d12e3b73ab37efed63c874dc9d188be6) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - Exclude runtime and type test files from the published npm package so only library sources are shipped.

## 1.9.8

### Patch Changes

- [`810614f`](https://github.com/Nahida-aa/agnostic-query/commit/810614f7d45b369a9199c2bca6d4c8b2167df45a) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - Fix db0 adapter SQL generation for PostgreSQL and SQLite helpers after shared SQL builder refactors.

## 1.9.7

### Patch Changes

- [`36bcd6d`](https://github.com/Nahida-aa/agnostic-query/commit/36bcd6d2f670a616b1a8ae6b6cf0bb1efb40b7b9) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - Fix SQL generation and SQLite adapter behavior for nested field paths, parameterized WHERE clauses, and `ilike`/set-operator handling.

## 1.9.6

### Patch Changes

- [`a617723`](https://github.com/Nahida-aa/agnostic-query/commit/a61772369725b05e2b26fa875c2c1aa11ff850c2) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - docs: update README and Chinese README operator documentation to reflect current SQL operator names
  feat: add compile-time trap overload banning `in` on array fields
  feat: export `ArrayKeyOf` type for array-field detection

## 1.9.5

### Patch Changes

- [`1fe8b9e`](https://github.com/Nahida-aa/agnostic-query/commit/1fe8b9ee8fac5f7719c43778334d06b9b273ac82) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - refactor: extract shared where building logic, add SetComparisonOp type guard, update skill docs

## 1.9.4

### Patch Changes

- [#14](https://github.com/Nahida-aa/agnostic-query/pull/14) [`6af7cb3`](https://github.com/Nahida-aa/agnostic-query/commit/6af7cb3b9b1834b1e69a3c2a88cfb7bf006b3c84) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - Document schema vs runtime database responsibilities and guidance for validation.

## 1.9.3

### Patch Changes

- [`22d2c14`](https://github.com/Nahida-aa/agnostic-query/commit/22d2c14bbe7a77103b53bcb27002dd419eba0e86) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - fix: make `findWhere` `where` parameter optional

## 1.9.2

### Patch Changes

- [`98656cf`](https://github.com/Nahida-aa/agnostic-query/commit/98656cf58e92e03116c4d1debba305d25d91b37a) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - fix: make `findWhere` `where` parameter optional

## 1.9.1

### Patch Changes

- [`b7e9eea`](https://github.com/Nahida-aa/agnostic-query/commit/b7e9eeac8d7725871fd92c0e106da06e424eca8b) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - docs: fix @> / <@ / && descriptions to match source comments

## 1.9.0

### Minor Changes

- [`4266f2e`](https://github.com/Nahida-aa/agnostic-query/commit/4266f2ed1d9956463cef14bce691ee5f91c9df13) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - feat!: replace `eq`/`gt`/`gte`/`lt`/`lte` with SQL symbols `=`/`>`/`>=`/`<`/`<=`; add `is null`, `@>`, `<@`, `&&` operators

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

## 1.8.1

### Patch Changes

- [`40bc098`](https://github.com/Nahida-aa/agnostic-query/commit/40bc09841855a4cbbbf7cf6b756d7bc00d2e4fcb) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - cleanup: remove stale v0/ and play/ directories; setup @tanstack/intent skills pipeline with query and adapters skills

## 1.8.0

### Minor Changes

- [`ddd3509`](https://github.com/Nahida-aa/agnostic-query/commit/ddd350935d5c71f6b0698fb1319c2798a026cc50) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - docs: highlight zero runtime dependencies and tree-shakeable adapters in README and homepage

## 1.7.0

### Minor Changes

- [`c54a7a6`](https://github.com/Nahida-aa/agnostic-query/commit/c54a7a68a5fbb0707fd8a16b70826db6799e8883) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - docs: update landing description to use realistic "search, filter, paginate" example instead of SQL `WHERE age >= 18`; sync across README, README.zh-CN, homepage, and Why page

## 1.6.0

### Minor Changes

- [`3d1d69b`](https://github.com/Nahida-aa/agnostic-query/commit/3d1d69b4334690be28658c49e02be814323cf633) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - feat: add fromTanDb convenience function for TanStack DB LoadSubsetOptions

## 1.5.0

### Minor Changes

- [`590bc16`](https://github.com/Nahida-aa/agnostic-query/commit/590bc16d5d97a22cd0b6f8640533485e1181f20c) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - feat: replace `cursor` with `mate` for metadata, add optional chaining safety, improve param naming

## 1.4.3

### Patch Changes

- [`0f8c9ad`](https://github.com/Nahida-aa/agnostic-query/commit/0f8c9adc61425e4868efbd57fbf60dbf8286a684) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - docs: add TanStack DB end-to-end example in README, update project.sync.ts

## 1.4.2

### Patch Changes

- [`cfea6db`](https://github.com/Nahida-aa/agnostic-query/commit/cfea6dbc3ed1c7271e4b7b8a7c52f35ccdae84a5) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - docs: sync Chinese README, add language links, remove zh-CN from npm package

## 1.4.1

### Patch Changes

- [`eace0a3`](https://github.com/Nahida-aa/agnostic-query/commit/eace0a37911fe9574958b5d31d7ffbab29cddb94) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - Fix: add `"."` and `"./*/*"` exports to package.json so `import { aq } from 'agnostic-query'` resolves correctly without needing `'agnostic-query/index'`

## 1.4.0

### Minor Changes

- [`06c9c39`](https://github.com/Nahida-aa/agnostic-query/commit/06c9c398c691de5d8eff56f4a93970fb45640b87) Thanks [@Nahida-aa](https://github.com/Nahida-aa)! - feat: extract `ComparisonWhereValue` type, remove duplicated conditional types

  feat: `and`/`or`/`not` now return `WhereExpr` instead of `QueryWhere` — supports arbitrary nesting depth in callbacks

  feat: add `newWhere` builder — standalone where-only builder for composing QueryWhere independently

  feat: `.where(null)` / `.where(undefined)` / `.where()` are now safe no-ops

  chore: set up Changesets for automated versioning and publishing
