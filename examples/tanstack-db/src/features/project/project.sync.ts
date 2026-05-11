// examples/tanstack-db/src/features/project/sync.ts
console.log('[pglite-demo/data.ts] module loaded');

import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
	BasicIndex,
	createCollection,
	type InitialQueryBuilder,
} from '@tanstack/react-db';
import { aq, newWhere, type QuerySchema } from 'agnostic-query';
import {
	fromTanDb,
	fromTanDbOrderBy,
	fromTanDbWhere,
} from 'agnostic-query/tanstack-db';
import { listProject } from '#/features/project/project.fn.ts';
import {
	type Project,
	projectSchema,
} from '#/features/project/project.schmea.ts';
import { getQueryClient } from '#/integrations/tanstack-query/provider';

export const projectCollect = createCollection(
	queryCollectionOptions({
		queryKey: ['project'],
		schema: projectSchema,
		getKey: (item) => item.id,
		queryClient: getQueryClient(),
		syncMode: 'on-demand',
		autoIndex: 'eager',
		defaultIndexType: BasicIndex,
		queryFn: async ({ meta, queryKey }) => {
			const data = fromTanDb(meta?.loadSubsetOptions);

			console.log('[infinite] queryFn fired:', {
				whereCurrent: meta?.loadSubsetOptions?.cursor?.whereCurrent,
				cursor: meta?.loadSubsetOptions?.cursor?.whereFrom,
				queryKey,
				offset: meta?.loadSubsetOptions?.offset,
				data,
			});

			const result = await listProject({
				data,
			});
			console.log('[infinite] result count:', result.length);

			return result;
		},
		onInsert: async () => {},
		onUpdate: async () => {},
		onDelete: async () => {},
	}),
);

export const infiniteProjectQuery = (q: InitialQueryBuilder) =>
	q.from({ p: projectCollect }).orderBy(({ p }) => p.created_at, 'desc');
