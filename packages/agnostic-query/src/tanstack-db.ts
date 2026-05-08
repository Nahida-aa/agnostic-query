import { parseWhereExpression } from '@tanstack/query-db-collection';
import type { SchemaShape } from './core/schema.ts';
import type { QueryWhere } from './core/where.ts';
import type { OrderBy, OrderByClause } from './order-by.ts';
// Comparison
export type FromTanDbWhereParam = Parameters<typeof parseWhereExpression>[0];
export const fromTanDbWhere = <TShape extends SchemaShape>(
	where: FromTanDbWhereParam,
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
			gt: (field, conditions) => ({
				field: field.join('.'),
				operator: 'gt',
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

export const fromTanDbOrderBy = <TShape extends SchemaShape>(
	orderBy:
		| { field: keyof TShape; dir: 'asc' | 'desc' }
		| { field: keyof TShape; dir: 'asc' | 'desc' }[]
		| null,
): OrderBy<TShape> | null => {
	if (!orderBy) return null;
	if (Array.isArray(orderBy)) {
		return orderBy.map((o) => ({
			field: o.field,
			direction: o.dir,
		})) as OrderBy<TShape>;
	}
	return {
		field: orderBy.field,
		direction: orderBy.dir,
	} as OrderByClause<TShape>;
};
