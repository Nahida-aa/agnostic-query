---
"agnostic-query": patch
---

Fix subpath imports (`/tanstack-db`, `/zod`, `/drizzle/pg`, etc.) failing to resolve under `moduleResolution: "bundler"` / `node16` / `nodenext` by replacing the deprecated trailing-slash `"./"` export map with an explicit `"./*"` pattern.

