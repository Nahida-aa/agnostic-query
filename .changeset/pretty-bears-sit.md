---
"agnostic-query": minor
---

feat: extract `ComparisonWhereValue` type, remove duplicated conditional types

feat: `and`/`or`/`not` now return `WhereExpr` instead of `QueryWhere` — supports arbitrary nesting depth in callbacks

feat: add `newWhere` builder — standalone where-only builder for composing QueryWhere independently

feat: `.where(null)` / `.where(undefined)` / `.where()` are now safe no-ops

chore: set up Changesets for automated versioning and publishing
