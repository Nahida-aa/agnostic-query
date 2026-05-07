import {
	parseLoadSubsetOptions,
	parseOrderByExpression,
	parseWhereExpression,
	queryCollectionOptions,
} from '@tanstack/query-db-collection';
import {
	and,
	BasicIndex,
	createCollection,
	createLiveQueryCollection,
	createOptimisticAction,
	type ExtractContext,
	eq,
	type InferCollectionType,
	type InferResultType,
	type InitialQueryBuilder,
	inArray,
	not,
	or,
	Query,
	type QueryBuilder,
	queryOnce,
} from '@tanstack/react-db';

import { getQueryClient } from '#/integrations/tanstack-query/provider.ts';
import { z } from 'zod';
import { fromTanDbWhere } from 'agnostic-query/tanstack-db';

const playSchema = z.object({
  id: z.string(),
});
export type Play = z.output<typeof playSchema>;
export const playlCollect = createCollection(
	queryCollectionOptions({
		queryKey: ['play'],
		queryClient: getQueryClient(),
		schema: playSchema,
		syncMode: 'on-demand',
		queryFn: async ({ queryKey, meta, pageParam }) => {
			const { limit, offset, where, orderBy, cursor } =
				meta?.loadSubsetOptions || {};
			const filter = fromTanDbWhere(where);
			const sorts = parseOrderByExpression(orderBy);
			console.log({
				filter,
				sorts,
				offset,
				cursor,
			});
			return [] as Play[];
		},
		getKey: (item) => item.id,
		onInsert: async ({ transaction }) => {
			const { modified } = transaction.mutations[0];
		},
		onUpdate: async ({ transaction }) => {
			const { changes, modified } = transaction.mutations[0];
		},
		onDelete: async ({ transaction }) => {
			const { original } = transaction.mutations[0];
		},
	}),
);

export type PlayRow = InferCollectionType<typeof playlCollect>;

export const getPlayQ =
	(id: string) => (q: InitialQueryBuilder) =>
		q
			.from({ play: playlCollect })
			.where(({ play }) =>
				eq(play.id, id),
			);

export type ListChannel = InferResultType<
	ExtractContext<ReturnType<ReturnType<typeof listChannelQ>>>
>;
