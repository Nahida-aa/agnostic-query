import { createServerFn } from '@tanstack/react-start';
import { toDrizzle } from 'agnostic-query/drizzle/pg';
import { createQuerySchema } from 'agnostic-query/zod';
import { db } from '#/db/index.ts';
import { timeId } from '#/db/timeId.ts';
import type { Project } from '#/features/project/project.schmea.ts';
import { projectTable } from '#/features/project/project.table.ts';

export const listProject = createServerFn()
	.inputValidator(createQuerySchema<Project>())
	.handler(async ({ data }) => {
		return await toDrizzle(db, projectTable, data);
	});

export const seedProjects = createServerFn()
	.handler(async () => {
		const count = await db.$count(projectTable);
		if (count > 0) return { inserted: 0, total: count };

		const rows: (typeof projectTable.$inferInsert)[] = [];
		for (let i = 0; i < 100; i++) {
			const daysAgo = 100 - i;
			const date = new Date(Date.now() - daysAgo * 86400000);
			rows.push({
				id: timeId(),
				name: `Project ${i + 1}`,
				order: i,
				created_at: date,
				updated_at: date,
			});
		}
		await db.insert(projectTable).values(rows);
		return { inserted: rows.length, total: rows.length };
	});
