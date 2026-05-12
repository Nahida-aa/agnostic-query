# agnostic-query — Skill Spec

Portable QuerySchema bridge between TanStack DB (client) and Drizzle/Kysely/SQL (server). Construct queries with a type-safe builder, serialize to JSON, execute via adapters.

## Domains

| Domain | Description | Skills |
| ------ | ----------- | ------ |
| query-building | Constructing portable QuerySchema objects | query |
| adapters | Converting QuerySchema to/from ORMs | adapters |

## Skill Inventory

| Skill | Type | Domain | What it covers | Failure modes |
| ----- | ---- | ------ | -------------- | ------------- |
| query | core | query-building | aq builder, WHERE operators, logical nesting, orderBy/limit/offset, newWhere, validation | 1 |
| adapters | core | adapters | toDrizzle, fromTanDb, toKysely, toDb0, toSql | 1 |

## Failure Mode Inventory

### query (1 failure mode)

| # | Mistake | Priority | Source | Cross-skill? |
| - | ------- | -------- | ------ | ------------ |
| 1 | Constructing QueryWhere objects directly | HIGH | maintainer interview | adapters |

### adapters (1 failure mode)

| # | Mistake | Priority | Source | Cross-skill? |
| - | ------- | -------- | ------ | ------------ |
| 1 | Assuming adapter dependencies are installed | MEDIUM | package.json peerDependenciesMeta | — |

## Tensions

| Tension | Skills | Agent implication |
| ------- | ------ | ----------------- |
| Type safety vs. quick prototyping | query ↔ adapters | AI agents default to raw object construction when the builder API seems verbose; always use the builder pattern |

## Cross-References

| From | To | Reason |
| ---- | -- | ------ |
| query | adapters | A constructed QuerySchema is nearly always consumed by an adapter |
| adapters | query | Understanding QuerySchema structure helps debug unexpected conversions |

## Subsystems & Reference Candidates

| Skill | Subsystems | Reference candidates |
| ----- | ---------- | ------------------- |
| adapters | Drizzle, Kysely, TanStack DB, db0, Raw SQL | — |
| query | — | WHERE operators (>10 comparison and logical operators) |

## Remaining Gaps

None.

## Recommended Skill File Structure

- **Core skills:** query, adapters (both framework-agnostic)

## Composition Opportunities

| Library | Integration points | Composition skill needed? |
| ------- | ------------------ | ------------------------- |
| @tanstack/db | fromTanDbWhere/fromTanDbOrderBy/fromTanDb | No (covered by adapters) |
| drizzle-orm | toDrizzle/toDrizzleWhere/toDrizzleOrderBy | No (covered by adapters) |
| kysely | fromKysely/toKyselyWhere/toKyselyOrderBy | No (covered by adapters) |
| db0 | toDb0Where/toDb0OrderBy/toDb0 | No (covered by adapters) |
