import {
	parseOrderByExpression,
	queryCollectionOptions,
} from '@tanstack/query-db-collection';
import {
	createCollection,
	createLiveQueryCollection,
} from '@tanstack/react-db';
import { z } from 'zod';
import { getPosts } from '#/features/pglite-demo/posts.fn.ts';
import { getQueryClient } from '#/integrations/tanstack-query/provider.ts';

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
		queryFn: async ({ meta, queryKey }) => {
			const { cursor, where, limit, offset, orderBy } =
				meta?.loadSubsetOptions ?? {};
			console.log({
				queryKey,
				cursor,
				limit,
				offset,
			});
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

export const postsInfiniteCollection = createLiveQueryCollection(
	(q) =>
		q
			.from({ posts: postsCollect })
			.orderBy(({ posts }) => posts.created_at, 'desc'),
);
