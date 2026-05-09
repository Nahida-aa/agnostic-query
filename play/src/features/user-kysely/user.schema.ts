import { createSelectSchema } from 'drizzle-zod';
import { userTable } from '#/features/user-kysely/user.table.ts';

export const userSchema = createSelectSchema(userTable);
export type UserShape = typeof userTable.$inferSelect;
