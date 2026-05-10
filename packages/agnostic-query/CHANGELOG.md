# agnostic-query

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
