import type { QuerySchema } from '../core';
import type { QueryOrderBy } from '../core/order-by.ts';
import type { FieldPath, SchemaShape } from '../core/schema.ts';
import type { QueryWhere } from '../core/where.ts';
import { isComparisonWhere } from '../core/where.ts';
import {
	_toSql,
	buildWhere as commonBuildWhere,
	toSqlOrderBy as commonOrderBy,
	quoteIdent,
} from './common.ts';
import type { SqlResult } from './types.ts';

export const fieldToStr = (field: FieldPath): string => {
	if (field.length === 1) return quoteIdent(field[0]);
	const [root, ...rest] = field;
	if (rest.every((p) => typeof p === 'number')) {
		return `${quoteIdent(root)}${rest.map((i) => `[${i + 1}]`).join('')}`;
	}
	const segStr = rest.map((p) =>
		typeof p === 'number' ? String(p) : `'${p.replace(/'/g, "''")}'`,
	);
	const last = segStr.pop()!;
	const prefix = segStr.join('->');
	return prefix
		? `${quoteIdent(root)}->${prefix}->>${last}`
		: `${quoteIdent(root)}->>${last}`;
};

export const toSqlWhere = (
	where?: QueryWhere | null,
): SqlResult | undefined => {
	if (!where) return;
	return commonBuildWhere(where, fieldToStr, (i) => `$${i}`);
};

export const toSqlOrderBy = <TShape extends SchemaShape>(
	orderBy?: QueryOrderBy<TShape>[],
): SqlResult | undefined => commonOrderBy(orderBy, fieldToStr);

export const toSql = <TShape extends SchemaShape>(
	json: QuerySchema<TShape>,
): SqlResult =>
	_toSql(json, fieldToStr, (w) =>
		commonBuildWhere(w, fieldToStr, (i) => `$${i}`),
	);
