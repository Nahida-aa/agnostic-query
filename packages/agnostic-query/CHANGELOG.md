# agnostic-query

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
