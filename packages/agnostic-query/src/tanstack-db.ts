import { parseWhereExpression } from '@tanstack/query-db-collection';
import type { QueryWhere, SchemaShape } from './where.js';

export const fromTanDbWhere = <TShape extends SchemaShape>(
	where: Parameters<typeof parseWhereExpression>[0],
) =>
	parseWhereExpression(where, {
		handlers: {
			eq: (field, conditions) => ({
				field: field.join('.'),
				operator: 'eq',
				conditions,
			}),
			lt: (field, conditions) => ({
				field: field.join('.'),
				operator: 'lt',
				conditions,
			}),
			in: (field, conditions) => ({
				field: field.join('.'),
				operator: 'in',
				conditions,
			}),
			and: (...conditions) => ({
				operator: 'and',
				conditions,
			}),
			or: (...conditions) => ({
				operator: 'or',
				conditions,
			}),
			not: (condition) => ({
				operator: 'not',
				conditions: condition,
			}),
		},
	}) as unknown as QueryWhere<TShape, any> | null;
