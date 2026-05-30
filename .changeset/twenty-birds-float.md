---
'agnostic-query': patch
---

Refine db0 adapter imports and package metadata by removing the package-level path alias, using local Db types, and dropping the unused @tanstack/query-db-collection dependency entry.