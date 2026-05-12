import { createServerFn } from '@tanstack/react-start';
import { toDrizzle } from 'agnostic-query/drizzle/pg';
import { createQuerySchema } from 'agnostic-query/zod';
import { db } from '#/db/index.ts';
import { timeId } from '#/db/timeId.ts';
import type { Project } from '#/features/project/project.schmea.ts';
import { projectTable } from '#/features/project/project.table.ts';

export const listProject = createServerFn()
	.inputValidator(createQuerySchema<Project>().optional())
	.handler(async ({ data }) => {
		const result = await toDrizzle(db, projectTable, data);
		console.log('[listProject] result:', result);
		return result;
	});

export const clearProjects = createServerFn().handler(async () => {
	const count = await db.$count(projectTable);
	if (count === 0) return { deleted: 0 };
	await db.delete(projectTable);
	return { deleted: count };
});

export const seedProjects = createServerFn().handler(async () => {
	const tagPool = ['frontend', 'backend', 'design', 'docs', 'test', 'devops'];
	const rows: (typeof projectTable.$inferInsert)[] = [];
	for (let i = 0; i < 100; i++) {
		const daysAgo = 100 - i;
		const date = new Date(Date.now() - daysAgo * 86400000);
		const count = 1 + Math.floor(Math.random() * 3); // 1–3 tags per project
		const pool =
			i % 3 === 0
				? ['frontend', 'backend', 'design', 'docs', 'test', 'devops', 'test']
				: tagPool;
		const shuffled = [...pool].sort(() => Math.random() - 0.5);
		const tags = [...new Set(shuffled.slice(0, count))];
		rows.push({
			id: timeId(),
			name: `Project ${i + 1}`,
			order: i,
			tags,
			created_at: date,
			updated_at: date,
		});
	}
	await db.insert(projectTable).values(rows);
	return { inserted: rows.length, total: rows.length };
});
