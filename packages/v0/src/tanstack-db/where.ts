import { parseWhereExpression } from '@tanstack/query-db-collection';
import type { SchemaShape } from '../core/schema.ts';
import type { QueryWhere } from '../core/where.ts';

export type FromTanDbWhereParam = Parameters<typeof parseWhereExpression>[0];

export const fromTanDbWhere = <TShape extends SchemaShape>(
	where: FromTanDbWhereParam,
) =>
	parseWhereExpression<QueryWhere<TShape>>(where, {
		handlers: {
			eq: (field, value) => ({
				field,
				op: 'eq',
				value,
			}),
			lt: (field, value) => ({
				field,
				op: 'lt',
				value,
			}),
			gt: (field, value) => ({
				field,
				op: 'gt',
				value,
			}),
			in: (field, values) => ({
				field,
				op: 'in',
				values,
			}),
			and: (...conditions) => ({
				op: 'and',
				conditions,
			}),
			or: (...conditions) => ({
				op: 'or',
				conditions,
			}),
			not: (condition) => ({
				op: 'not',
				condition,
			}),
		},
	});
