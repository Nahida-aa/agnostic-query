import { createServerFn } from '@tanstack/react-start';
import { toDrizzleOrderBy } from 'agnostic-query/drizzle/pg';
import { createQuerySchema } from 'agnostic-query/zod';
import { asc, desc, type SQL } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import type { Post } from '#/db/schema.ts';
import * as schema from '#/db/schema.ts';
import { getDb } from '#/db/server-pglite.ts';

export interface GetPostsInput {
	limit: number;
	offset: number;
	orderBy: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

export const getPosts = createServerFn({ method: 'GET' })
	.inputValidator(createQuerySchema<Post>())
	.handler(async ({ data }) => {
		const db = await getDb();

		const orderByExprs = toDrizzleOrderBy(schema.post, data.orderBy);

		const rows = await db
			.select()
			.from(schema.post)
			.orderBy(...orderByExprs)
			.limit(data.limit ?? 10)
			.offset(data.offset);

		return rows;
	});
