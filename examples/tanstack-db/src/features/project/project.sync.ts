// examples/tanstack-db/src/features/project/sync.ts
console.log('[pglite-demo/data.ts] module loaded');

import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
	createCollection,
	type InitialQueryBuilder,
} from '@tanstack/react-db';
import type { QuerySchema } from 'agnostic-query/core/index';
import { fromTanDbOrderBy, fromTanDbWhere } from 'agnostic-query/tanstack-db';
import { listProject } from '#/features/project/project.fn.ts';
import {
	type Project,
	projectSchema,
} from '#/features/project/project.schmea.ts';
import { getQueryClient } from '#/integrations/tanstack-query/provider';

export const projectCollect = createCollection(
	queryCollectionOptions({
		queryKey: ['project'],
		queryClient: getQueryClient(),
		schema: projectSchema,
		syncMode: 'eager',
		queryFn: async ({ meta, queryKey }) => {
			console.log('[infinite] queryFn FIRED!', { queryKey, meta });
			const { where, limit, offset, orderBy } =
				meta?.loadSubsetOptions ?? {};
			const data: QuerySchema<Project> = {
				limit,
				offset,
				where: fromTanDbWhere<Project>(where),
				orderBy: fromTanDbOrderBy<Project>(orderBy),
			};
			console.log('[infinite] queryFn fired:', {
				syncMode: 'eager',
				limit,
				offset,
				orderBy,
			});

			const result = await listProject({
				data,
			});
			console.log('[infinite] result count:', result.length);

			return result;
		},
		getKey: (item) => item.id,
		onInsert: async () => {},
		onUpdate: async () => {},
		onDelete: async () => {},
	}),
);

export const infiniteProjectQuery = (q: InitialQueryBuilder) =>
	q
		.from({ p: projectCollect })
		.orderBy(({ p }) => p.created_at, 'desc');
