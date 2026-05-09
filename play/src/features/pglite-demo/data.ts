console.log('[pglite-demo/data.ts] module loaded');

import {
	parseOrderByExpression,
	queryCollectionOptions,
} from '@tanstack/query-db-collection';
import {
	createCollection,
	createLiveQueryCollection,
	type InitialQueryBuilder,
} from '@tanstack/react-db';
import type { QuerySchema } from 'agnostic-query/core/index';
import { fromTanDbOrderBy, fromTanDbWhere } from 'agnostic-query/tanstack-db';
import { z } from 'zod';
import { type Post, postSchema } from '#/db/schema.ts';
import { setCursor } from '#/features/pglite-demo/cursor-store.ts';
import { getPosts } from '#/features/pglite-demo/posts.fn.ts';
import { getQueryClient } from '#/integrations/tanstack-query/provider';

console.log('[pglite-demo/data.ts] building postsCollect (on-demand)');
export const postsCollect = createCollection(
	queryCollectionOptions({
		queryKey: ['post'],
		queryClient: getQueryClient(),
		schema: postSchema,
		syncMode: 'on-demand',
		queryFn: async ({ meta, queryKey }) => {
			console.log('[pglite-demo] queryFn FIRED!', { queryKey, meta });
			const { cursor, where, limit, offset, orderBy } =
				meta?.loadSubsetOptions ?? {};
			const data: QuerySchema<Post> = {
				limit: limit ?? 10,
				offset: offset ?? 0,
				where: fromTanDbWhere<Post>(where),
				orderBy: fromTanDbOrderBy<Post>(orderBy),
			};
			console.log({
				queryKey,
				cursor,
				data,
			});
			setCursor({ cursor, queryKey, limit, offset, timestamp: Date.now() });

			const result = await getPosts({
				data,
			});
			console.log('Query result.length:', result.length);

			return result;
		},
		getKey: (item) => item.id,
		onInsert: async () => {},
		onUpdate: async () => {},
		onDelete: async () => {},
	}),
);

console.log('[pglite-demo/data.ts] building postsCollectEager');
export const postsCollectEager = createCollection(
	queryCollectionOptions({
		queryKey: ['post-eager'],
		queryClient: getQueryClient(),
		schema: postSchema,
		syncMode: 'eager',
		queryFn: async ({ meta, queryKey }) => {
			console.log('[pglite-demo/eager] queryFn FIRED!', { queryKey, meta });
			const { cursor, where, limit, offset, orderBy } =
				meta?.loadSubsetOptions ?? {};
			const data: QuerySchema<Post> = {
				limit: limit ?? 100,
				offset: offset ?? 0,
				where: fromTanDbWhere<Post>(where),
				orderBy: fromTanDbOrderBy<Post>(orderBy),
			};
			console.log('[pglite-demo/eager]', { queryKey, data });

			const result = await getPosts({ data });
			console.log('[pglite-demo/eager] result.length:', result.length);
			return result;
		},
		getKey: (item) => item.id,
		onInsert: async () => {},
		onUpdate: async () => {},
		onDelete: async () => {},
	}),
);

export const postsInfiniteQuery = (q: InitialQueryBuilder) =>
	q
		.from({ posts: postsCollect })
		.orderBy(({ posts }) => posts.created_at, 'desc');

export const postsEagerQuery = (q: InitialQueryBuilder) =>
	q
		.from({ posts: postsCollectEager })
		.orderBy(({ posts }) => posts.created_at, 'desc');

export const postsInfiniteCollection = createLiveQueryCollection((q) =>
	q
		.from({ posts: postsCollect })
		.orderBy(({ posts }) => posts.created_at, 'desc'),
);
