---
name: drizzle-orm
description: Guidelines for developing with Drizzle ORM, a lightweight type-safe TypeScript ORM with SQL-like syntax
---

# Drizzle ORM Development Guidelines


## Query Patterns

### Insert Operations

```typescript
// Single insert
const newUser = await db
  .insert(users)
  .values({
    email: "user@example.com",
    name: "John Doe",
  })
  .returning();

// Bulk insert
await db.insert(users).values([
  { email: "user1@example.com", name: "User 1" },
  { email: "user2@example.com", name: "User 2" },
]);

// Upsert (insert or update on conflict)
await db
  .insert(users)
  .values({ email: "user@example.com", name: "John" })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: "John Updated" },
  });
```
