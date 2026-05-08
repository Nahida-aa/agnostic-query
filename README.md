# Agnostic Query

Database-agnostic query condition library with type-safe WHERE clause definitions.

## Architecture

```mermaid
graph TB
    subgraph Package["agnostic-query"]
        core["src/where.ts<br/>QueryWhere types<br/>UnaryComparisonWhere / MultiWhere / UnaryWhere<br/>findValueInWhere helper"]
        zod["src/zod.ts<br/>createWhereSchema<br/>Zod validation"]
        valibot["src/valibot.ts<br/>createWhereSchema<br/>Valibot validation"]
        drizzle["src/drizzle.ts<br/>toDrizzleWhere<br/>QueryWhere → SQL"]
        tanstack["src/tanstack-db.ts<br/>fromTanDbWhere<br/>TanStack Expression → QueryWhere"]
    end

    zod --> core
    valibot --> core
    drizzle --> core
    tanstack --> core

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
        qw[QueryWhere]
    end

    subgraph Output["Output"]
        drizzle["toDrizzleWhere → SQL"]
    end

    client --> qw
    qw --> zod
    qw --> valibot
    tanstack_expr --> tanparse --> qw
    qw --> drizzle

    style Input fill:#fff3e0
    style Parse fill:#fff8e1
    style Validate fill:#f3e5f5
    style Core fill:#e1f5fe
    style Output fill:#e8f5e9
```

## WHERE Condition Structure

```mermaid
classDiagram
    class QueryWhere {
        <<union>>
    }

    class UnaryComparisonWhere {
        +field: K
        +operator: UnaryComparisonOp
        +conditions: TShape[K]
    }

    class MultiWhere {
        +operator: 'and' | 'or'
        +conditions: QueryWhere[]
    }

    class UnaryWhere {
        +operator: 'not'
        +conditions: QueryWhere
    }

    QueryWhere <|-- UnaryComparisonWhere
    QueryWhere <|-- MultiWhere
    QueryWhere <|-- UnaryWhere

    class UnaryComparisonOp {
        <<enumeration>>
        eq
        gt
        gte
        lt
        lte
        like
        ilike
        in
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
```

### Import paths

```ts
// Core types
import { QueryWhere, findValueInWhere } from 'agnostic-query'

// Zod validation
import { createWhereSchema } from 'agnostic-query/zod'

// Valibot validation
import { createWhereSchema } from 'agnostic-query/valibot'

// Drizzle adapter
import { toDrizzleWhere } from 'agnostic-query/drizzle'

// TanStack DB adapter
import { fromTanDbWhere } from 'agnostic-query/tanstack-db'
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
