import {
	type InferCollectionType,
	type InitialQueryBuilder,
	createCollection,
} from '@tanstack/react-db';
import {
	parseOrderByExpression,
	queryCollectionOptions,
} from '@tanstack/query-db-collection';
import { getQueryClient } from '#/integrations/tanstack-query/provider.ts';
import { getPosts } from '#/lib/server/posts.ts';
import type { PostRow as ServerPostRow } from '#/lib/server/posts.ts';
import { z } from 'zod';

const postSchema = z.object({
	id: z.string(),
	title: z.string(),
	body: z.string(),
	created_at: z.string(),
});

export type Post = z.output<typeof postSchema>;

export const postsCollect = createCollection(
	queryCollectionOptions({
		queryKey: ['posts'],
		queryClient: getQueryClient(),
		schema: postSchema,
		syncMode: 'on-demand',
		queryFn: async ({ meta }) => {
			const { limit, offset, orderBy } = meta?.loadSubsetOptions ?? {};
			const sorts = parseOrderByExpression(orderBy);

			const result = await getPosts({
				data: {
					limit: limit ?? 20,
					offset: offset ?? 0,
					orderBy:
						sorts.length > 0
							? sorts.map((s) => ({
									field: s.field[s.field.length - 1] as string,
									direction: s.direction,
								}))
							: [{ field: 'created_at', direction: 'desc' as const }],
				},
			});

			return result as unknown as Post[];
		},
		getKey: (item) => item.id,
		onInsert: async () => {},
		onUpdate: async () => {},
		onDelete: async () => {},
	}),
);

export type PostRow = InferCollectionType<typeof postsCollect>;

export const postsInfiniteQuery = (q: InitialQueryBuilder) =>
	q.from({ posts: postsCollect }).orderBy(({ posts }) => posts.created_at, 'desc');
