import { createServerFn } from '@tanstack/react-start';
import { toDrizzle } from 'agnostic-query/drizzle/pg';
import { createQuerySchema } from 'agnostic-query/zod';
import { db } from '#/db/index.ts';
import type { Project } from '#/features/project/project.schmea.ts';
import { projectTable } from '#/features/project/project.table.ts';

export const listProject = createServerFn()
	.inputValidator(createQuerySchema<Project>())
	.handler(async ({ data }) => {
		return await toDrizzle(db, projectTable, data);
	});
