// https://tanstack.com/db/latest/docs/guides/live-queries#available-operators

import { parseWhereExpression } from '@tanstack/query-db-collection';
import type { QueryWhere, SchemaShape } from '@agnostic-query/core';

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
				conditions: condition, // not 只有一个子条件
			}),
		},
	}) as unknown as QueryWhere<TShape, any> | null;
