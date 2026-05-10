// examples/tanstack-db/src/features/project/sync.ts
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
		syncMode: 'on-demand',
		queryFn: async ({ meta, queryKey }) => {
			console.log('[pglite-demo] queryFn FIRED!', { queryKey, meta });
			const { cursor, where, limit, offset, orderBy } =
				meta?.loadSubsetOptions ?? {};
			const data: QuerySchema<Project> = {
				limit: limit ?? 10,
				offset: offset ?? 0,
				where: fromTanDbWhere<Project>(where),
				orderBy: fromTanDbOrderBy<Project>(orderBy),
			};
			console.log({
				queryKey,
				cursor,
				data,
			});

			const result = await listProject({
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
