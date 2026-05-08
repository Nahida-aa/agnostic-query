import {
	// FieldPath,
	type ParsedOrderBy,
	parseLoadSubsetOptions,
	parseOrderByExpression,
	parseWhereExpression,
	queryCollectionOptions,
	type SimpleComparison,
} from '@tanstack/query-db-collection';
import {
	add,
	and,
	BasicIndex,
	type CursorExpressions,
	createCollection,
	createLiveQueryCollection,
	createOptimisticAction,
	type ExtractContext,
	eq,
	gte,
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
import { fromTanDbWhere } from 'agnostic-query/tanstack-db';
import { z } from 'zod';
import { timeId } from '#/db/timeId.ts';
import { getQueryClient } from '#/integrations/tanstack-query/provider.ts';
import type { QueryWhere } from '../../../../packages/agnostic-query/src/core/where';

const userSchema = z.object({
	id: z.string(),
	age: z.number(),
});

export type User = z.output<typeof userSchema>;
export const userCollect = createCollection(
	queryCollectionOptions({
		queryKey: ['user'],
		queryClient: getQueryClient(),
		schema: userSchema,
		syncMode: 'on-demand',
		queryFn: async ({ queryKey, meta, pageParam }) => {
			const { limit, offset, where, orderBy, cursor } =
				meta?.loadSubsetOptions || {};
			const parsed = parseLoadSubsetOptions(meta?.loadSubsetOptions);
			const filter = fromTanDbWhere(where);
			const sorts = parseOrderByExpression(orderBy);
			const ret = {
				filter,
				sorts,
				offset,
				limit,
				cursor,
				parsed,
			};
			console.log({ user: ret });

			return [
				{
					id: timeId(),
					age: 18,
				},
			] as User[];
		},
		getKey: (item) => item.id,
		autoIndex: 'eager',
		defaultIndexType: BasicIndex,
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

const filterSchema = z.lazy(() => z.object<QueryWhere>());
const playSchema = z.object({
	id: z.string(),
	// parsed: parsedSchema,
	filter: filterSchema,
	sorts: z.array(
		z.object({ field: z.string().array(), direction: z.enum(['asc', 'desc']) }),
	),
	limit: z.number().optional(),
	cursor: z.object<CursorExpressions>().optional(),
	offset: z.number().optional(),
});

export type Play = z.output<typeof playSchema>;
export const playCollect = createCollection(
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
			const ret = {
				orderBy,
				filter,
				sorts,
				limit,
				cursor,
				offset,
			};
			console.log({ ret });

			return [
				{
					...ret,
					id: timeId(),
				},
			] as Play[];
		},
		getKey: (item) => item.id,
		autoIndex: 'eager',
		defaultIndexType: BasicIndex,
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

export type PlayRow = InferCollectionType<typeof playCollect>;

export const getPlayQ = (id: string) => (q: InitialQueryBuilder) =>
	q.from({ play: playCollect }).where(({ play }) => eq(play.id, id));

export type ListPlay = InferResultType<
	ExtractContext<ReturnType<ReturnType<typeof getPlayQ>>>
>;

export const demoQuery = (q: InitialQueryBuilder) =>
	q
		.from({ play: playCollect })
		.join({ user: userCollect }, ({ play, user }) => eq(play.id, user.id))
		.where(({ play, user }) =>
			and(
				eq(add(user.age, 2), 18), // 这里演示一下表达式，虽然没有实际意义
				// or(eq(play.id, 'some-id-3'), not(eq(play.id, 'some-id-3'))),
				not(eq(play.filter.op, 'some-id-1')),
				not(inArray(play.id, ['some-id-1', 'some-id-2'])),
			),
		)
		.orderBy(({ play }) => play.id, 'desc')
		.limit(10);
