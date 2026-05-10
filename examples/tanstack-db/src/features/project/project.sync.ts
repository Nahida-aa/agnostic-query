// examples/tanstack-db/src/features/project/sync.ts
console.log('[pglite-demo/data.ts] module loaded');

import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
	BasicIndex,
	createCollection,
	type InitialQueryBuilder,
} from '@tanstack/react-db';
import { aq, type QuerySchema } from 'agnostic-query';
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
		autoIndex: 'eager',
		defaultIndexType: BasicIndex,
		queryFn: async ({ meta, queryKey }) => {
			const { where, limit, offset, orderBy, cursor } =
				meta?.loadSubsetOptions ?? {};
			const schema: QuerySchema<Project> = {
				limit,
				// offset,
				where: fromTanDbWhere(where),
				orderBy: fromTanDbOrderBy(orderBy),
				// cursor: fromTanDbWhere(cursor?.whereFrom),
			};

			const whereFrom = fromTanDbWhere<Project>(cursor?.whereFrom);
			const data = aq(schema).where(whereFrom).toJSON();

			console.log('[infinite] queryFn fired:', {
				whereCurrent: cursor?.whereCurrent,
				cursor: cursor?.whereFrom,
				queryKey,
				limit,
				offset,
				orderBy,
				data,
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
	q.from({ p: projectCollect }).orderBy(({ p }) => p.created_at, 'desc');
