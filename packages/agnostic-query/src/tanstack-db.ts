import type { LoadSubsetOptions } from '@tanstack/db';
import {
	parseOrderByExpression,
	parseWhereExpression,
} from '@tanstack/query-db-collection';
import type { QuerySchema } from './core/index.ts';
import type { QueryOrderBy } from './core/order-by.ts';
import type { SchemaShape } from './core/schema.ts';
import { newWhere, type QueryWhere } from './core/where.ts';

export type FromTanDbWhereParam = Parameters<typeof parseWhereExpression>[0];

export const fromTanDbWhere = <TShape extends SchemaShape>(
	where: FromTanDbWhereParam,
) =>
	parseWhereExpression<QueryWhere<TShape>>(where, {
		handlers: {
			eq: (field, value) => ({
				field,
				op: '=',
				value,
			}),
			lt: (field, value) => ({
				field,
				op: '<',
				value,
			}),
			lte: (field, value) => ({
				field,
				op: '<=',
				value,
			}),
			gt: (field, value) => ({
				field,
				op: '>',
				value,
			}),
			gte: (field, value) => ({
				field,
				op: '>=',
				value,
			}),
			like: (field, value) => ({
				field,
				op: 'like',
				value,
			}),
			ilike: (field, value) => ({
				field,
				op: 'ilike',
				value,
			}),
			in: (field, values) => ({
				field,
				op: 'in',
				values,
			}),
			isNull: (field) => ({
				field,
				op: 'is null',
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

/**
 * 与默认解析器 结构相同
 *
 * 注意：`parseOrderByExpression` 内部数组输入走 `Array.isArray` 检查，
 * 但 null/undefined 不会触发该分支，会返回空数组 `[]`。
 * 因此 `fromTanDbOrderBy(null)` 返回 `[]`，不是 `null`。
 */
export type FromTanDbOrderByParam = Parameters<
	typeof parseOrderByExpression
>[0];
export const fromTanDbOrderBy = <TShape extends SchemaShape>(
	orderBy: FromTanDbOrderByParam,
) => parseOrderByExpression(orderBy) as unknown as QueryOrderBy<TShape>[];

export const fromTanDb = <TShape extends SchemaShape>(
	loadSubsetOptions?: LoadSubsetOptions,
) => {
	return {
		limit: loadSubsetOptions?.limit,
		// offset,
		where: newWhere(fromTanDbWhere(loadSubsetOptions?.where))
			.where(fromTanDbWhere(loadSubsetOptions?.cursor?.whereFrom))
			.toJSON(),
		orderBy: fromTanDbOrderBy(loadSubsetOptions?.orderBy),
	} as QuerySchema<TShape>;
};
