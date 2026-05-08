import { createServerFn } from '@tanstack/react-start';
import { type SQL, asc, desc } from 'drizzle-orm';
import * as schema from '#/db/schema.ts';
import { getDb } from '#/db/server-pglite.ts';

const columnMap: Record<string, any> = {
	id: schema.posts.id,
	title: schema.posts.title,
	body: schema.posts.body,
	created_at: schema.posts.createdAt,
	createdAt: schema.posts.createdAt,
};

export interface GetPostsInput {
	limit: number;
	offset: number;
	orderBy: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

export type PostRow = {
	id: string;
	title: string;
	body: string;
	created_at: string;
};

export const getPosts = createServerFn({ method: 'GET' })
	.inputValidator((data: GetPostsInput) => data)
	.handler(async ({ data }) => {
		const db = await getDb();

		const orderByExprs: SQL[] = [];
		for (const o of data.orderBy) {
			const col = columnMap[o.field];
			if (col) {
				orderByExprs.push(o.direction === 'desc' ? desc(col) : asc(col));
			}
		}
		if (orderByExprs.length === 0) {
			orderByExprs.push(desc(schema.posts.createdAt));
		}

		const rows = await db
			.select()
			.from(schema.posts)
			.orderBy(...orderByExprs)
			.limit(data.limit)
			.offset(data.offset);

		return rows.map((row) => ({
			id: row.id,
			title: row.title,
			body: row.body,
			created_at:
				row.createdAt instanceof Date
					? row.createdAt.toISOString()
					: String(row.createdAt),
		})) satisfies PostRow[];
	});
