# Agnostic Query

数据库无关的查询条件库，提供类型安全的 WHERE 条件定义，可在不同 ORM/框架间通用。

## 架构

```mermaid
graph TB
    subgraph Core["packages/core"]
        where_types["where.ts<br/>QueryWhere 类型定义<br/>BaseWhere / MultiWhere / UnaryWhere"]
        find_helper["findValueInWhere<br/>值提取助手函数"]
    end

    subgraph Validation["验证层"]
        zod["packages/zod<br/>createWhereSchema<br/>Zod 验证"]
        valibot["packages/valibot<br/>createWhereSchema<br/>Valibot 验证"]
    end

    subgraph Adapters["适配器层"]
        drizzle["packages/drizzle<br/>buildDrizzleWhere<br/>QueryWhere → SQL"]
        tanstack["packages/tanstack-db<br/>parseWhere<br/>TanStack Expression → QueryWhere"]
    end

    zod --> where_types
    valibot --> where_types
    drizzle --> where_types
    tanstack --> where_types

    style Core fill:#e1f5fe
    style Validation fill:#f3e5f5
    style Adapters fill:#e8f5e9
```

## 数据流

```mermaid
flowchart LR
    subgraph Input["输入"]
        client[客户端查询对象]
        tanstack_expr[TanStack Expression]
    end

    subgraph Validate["验证"]
        zod[Zod Schema]
        valibot[Valibot Schema]
    end

    subgraph Core["核心"]
        qw[QueryWhere]
    end

    subgraph Output["输出"]
        drizzle[Drizzle SQL]
    end

    client --> zod
    client --> valibot
    zod --> qw
    valibot --> qw
    tanstack_expr --> tanstack_parse["parseWhere"]
    tanstack_parse --> qw
    qw --> drizzle

    style Input fill:#fff3e0
    style Validate fill:#f3e5f5
    style Core fill:#e1f5fe
    style Output fill:#e8f5e9
```

## WHERE 条件结构

```mermaid
classDiagram
    class QueryWhere {
        <<union>>
    }

    class BaseWhere {
        +field: K
        +operator: BaseWhereOp
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

    QueryWhere <|-- BaseWhere
    QueryWhere <|-- MultiWhere
    QueryWhere <|-- UnaryWhere

    class BaseWhereOp {
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

    BaseWhere --> BaseWhereOp
```

## 包说明

| 包 | 描述 |
|---|---|
| `@agnostic-query/core` | 核心类型和操作符定义 |
| `@agnostic-query/zod` | Zod v4 运行时验证 Schema |
| `@agnostic-query/valibot` | Valibot 运行时验证 Schema |
| `@agnostic-query/drizzle` | Drizzle ORM 适配器：`QueryWhere → SQL` |
| `@agnostic-query/tanstack-db` | TanStack DB 适配器：`TanStack Expression → QueryWhere` |

## 工具链

- 包管理: **bun** (workspaces)
- 类型检查: **tsgo** (TypeScript Go / TS 7.0 preview)
- 验证库: **zod v4**

## 使用

```bash
bun install
```
