# Agnostic Query

**Runtime-agnostic** query schema — core types are plain data that work in browsers, servers, and edge runtimes. The same `QuerySchema` can be serialized (JSON), transmitted over HTTP, and consumed by any adapter on any platform.

**Database-agnostic** — the same `QueryWhere` / `QueryOrderBy` can drive Drizzle, Kysely, raw SQL (PostgreSQL), or any future adapter.

## Architecture

```mermaid
graph TB
    subgraph Package["agnostic-query"]
        core["src/core/<br/>QuerySchema: {limit, offset, orderBy, where}<br/>QueryWhere types<br/>FieldPathByShape type"]
        zod["src/zod.ts<br/>createWhereSchema<br/>Zod validation"]
        valibot["src/valibot.ts<br/>createWhereSchema<br/>Valibot validation"]
        drizzle["src/drizzle.ts<br/>toDrizzleWhere<br/>QueryWhere → Drizzle SQL"]
        tanstack["src/tanstack-db.ts<br/>fromTanDbWhere<br/>TanStack DB → QueryWhere"]
        kysely["src/kysely/<br/>fromKysely: Kysely AST → QuerySchema<br/>toKyselyWhere: QueryWhere → Kysely<br/>toKyselyOrderBy: QueryOrderBy → Kysely"]
        sql["src/sql/pg.ts<br/>toSqlString: QueryWhere → SQL<br/>toSqlOrderBy: QueryOrderBy → SQL"]
    end

    zod --> core
    valibot --> core
    drizzle --> core
    tanstack --> core
    kysely --> core
    sql --> core

    style Package fill:#e1f5fe
```

## Data Flow

```mermaid
flowchart LR
    subgraph Input["Untrusted Input"]
        client[Client Request]
        tanstack_expr[TanStack Expression]
    end

    subgraph Parse["Parse"]
        tanparse["fromTanDbWhere"]
    end

    subgraph Validate["Optional Validation"]
        zod[Zod Schema]
        valibot[Valibot Schema]
    end

    subgraph Core["Core"]
        qs[QuerySchema]
        qw[QueryWhere]
        qob[QueryOrderBy]
    end

    subgraph Output["Output"]
        drizzle["toDrizzleWhere → SQL"]
        kysely_out["toKyselyWhere / toKyselyOrderBy"]
        sql_out["toSqlString / toSqlOrderBy"]
    end

    subgraph Input2["Kysely Query"]
        kysely_ast[Kysely SelectQueryBuilder]
    end

    subgraph Parse2["Parse"]
        kysely_parse["fromKysely"]
    end

    client --> qs
    qs --> zod
    qs --> valibot
    tanstack_expr --> tanparse --> qs
    qs -- where --> drizzle
    qs -- where/orderBy --> kysely_out
    qs -- where/orderBy --> sql_out
    kysely_ast --> kysely_parse --> qs

    style Input fill:#fff3e0
    style Parse fill:#fff8e1
    style Validate fill:#f3e5f5
    style Core fill:#e1f5fe
    style Output fill:#e8f5e9
```

## QuerySchema Structure

```mermaid
classDiagram
    class QuerySchema {
        +limit?: number
        +offset?: number
        +orderBy?: QueryOrderBy[]
        +where?: QueryWhere
    }

    class QueryOrderBy {
        +field: FieldPath
        +direction: 'asc' | 'desc'
    }

    class QueryWhere {
        <<union>>
    }

    class UnaryComparisonWhere {
        +field: FieldPath
        +op: UnaryComparisonOp
        +value: TShape[K]
    }

    class MultiComparisonWhere {
        +field: FieldPath
        +op: 'in'
        +values: TShape[K][]
    }

    class MultiLogicalWhere {
        +op: 'and' | 'or'
        +conditions: QueryWhere[]
    }

    class UnaryLogicalWhere {
        +op: 'not'
        +condition: QueryWhere
    }

    QuerySchema --> QueryOrderBy
    QuerySchema --> QueryWhere
    QueryWhere <|-- UnaryComparisonWhere
    QueryWhere <|-- MultiComparisonWhere
    QueryWhere <|-- MultiLogicalWhere
    QueryWhere <|-- UnaryLogicalWhere

    class UnaryComparisonOp {
        <<enumeration>>
        eq
        gt
        gte
        lt
        lte
        like
        ilike
    }

    UnaryComparisonWhere --> UnaryComparisonOp
```

## Usage

```bash
bun add agnostic-query
```

Then install only the adapters you need:

```bash
# For runtime validation
bun add zod          # optional
bun add valibot      # optional

# For ORM adapters
bun add drizzle-orm  # optional
bun add @tanstack/query-db-collection  # optional

# For Kysely adapter
bun add kysely  # optional
```

### Import paths

```ts
// Core types
import { QuerySchema, QueryWhere, QueryOrderBy, findWhere } from 'agnostic-query'

// Zod validation
import { createWhereSchema } from 'agnostic-query/zod'

// Valibot validation
import { createWhereSchema } from 'agnostic-query/valibot'

// Drizzle adapter — apply where to Drizzle query
import { toDrizzleWhere } from 'agnostic-query/drizzle'

// TanStack DB adapter — parse TanStack expression into QueryWhere
import { fromTanDbWhere } from 'agnostic-query/tanstack-db'

// Kysely adapter — bidirectional
import { fromKysely, toKyselyWhere, toKyselyOrderBy } from 'agnostic-query/kysely'

// SQL adapter — parameterised SQL generation
import { toSqlString, toSqlOrderBy } from 'agnostic-query/sql'
```

## Toolchain

- Package manager: **bun** (workspaces)
- Type checking: **tsgo** (TypeScript Go / TS 7.0 preview)
- Validation: **zod v4** / **valibot v1**

## Examples

```bash
cd examples/with-drizzle
bun start
```

```bash
cd examples/with-kysely
bun start
```
