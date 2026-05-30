import type { Db } from '#/db0/types.ts';
import type { QuerySchema } from '../core';
import type { QueryOrderBy } from '../core/order-by.ts';
import type { QueryWhere } from '../core/where.ts';
import { buildWhere as commonBuildWhere } from '../sql/common.ts';
import { fieldToStr, toSql } from '../sql/sqlite.ts';
import type { SqlResult } from '../sql/types.ts';

export const toDb0Where = (
	where?: QueryWhere | undefined,
): SqlResult | undefined => {
	if (!where) return;
	return commonBuildWhere(where, fieldToStr, () => '?');
};

export const toDb0OrderBy = <TShape extends Record<string, any>>(
	orderBy?: QueryOrderBy<TShape>[] | null,
): SqlResult | undefined => {
	if (!orderBy) return;
	const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
	return {
		sql: clauses
			.map((c) => `${fieldToStr(c.field)} ${c.direction.toUpperCase()}`)
			.join(', '),
		params: [],
	};
};

export const toDb0 = <T extends Record<string, any>, D extends Db>(
	db: D,
	json: QuerySchema<T>,
): Promise<T[]> | T[] => {
	const result = toSql(json);
	if (!result) return [];
	return db.prepare(result.sql).all<T>(...result.params);
};
