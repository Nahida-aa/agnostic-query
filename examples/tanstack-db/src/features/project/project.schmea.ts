import { createSelectSchema } from 'drizzle-zod';
import { projectTable } from './project.table.ts';

export const projectSchema = createSelectSchema(projectTable);
export type Project = typeof projectTable.$inferSelect;
