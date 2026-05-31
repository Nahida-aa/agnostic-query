---
"agnostic-query": patch
---

fix: drizzle/sqlite.ts imports fieldToStr from sql/pg.ts instead of sql/sqlite.ts
feat: add db0/sqlite adapter for SQLite-flavored SQL via db0-compatible drivers
feat: extract Db type to db0/types.ts for reuse
fix: refactor type tests to use @ts-expect-error without expectError wrapper
docs: update README and docs with db0 adapter documentation and SQLite variant
