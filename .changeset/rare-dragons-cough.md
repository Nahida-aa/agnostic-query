---
"agnostic-query": patch
---

Fix: add `"."` and `"./*/*"` exports to package.json so `import { aq } from 'agnostic-query'` resolves correctly without needing `'agnostic-query/index'`
