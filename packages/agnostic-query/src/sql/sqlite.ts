import type { QuerySchema } from '../core';
import type { QueryOrderBy } from '../core/order-by.ts';
import type { FieldPath, SchemaShape } from '../core/schema.ts';
import type { QueryWhere } from '../core/where.ts';
import { isComparisonWhere } from '../core/where.ts';
import {
	buildWhere as commonBuildWhere,
	toSqlOrderBy as commonOrderBy,
	quoteIdent,
	toSql as toSqlGeneric,
} from './common.ts';
import type { SqlResult } from './types.ts';

const fieldToStr = (field: FieldPath): string => {
	if (field.length === 1) return quoteIdent(field[0]);
	const [root, ...rest] = field;
	const path = rest
		.map((p) =>
			typeof p === 'number' ? `[${p}]` : `.${p.replace(/'/g, "''")}`,
		)
		.join('');
	return `json_extract(${quoteIdent(root)}, '$${path}')`;
};

export const toSqlWhere = (
	where?: QueryWhere | null,
): SqlResult | undefined => {
	if (!where) return;
	return commonBuildWhere(where, fieldToStr, () => '?');
};

export const toSqlOrderBy = <TShape extends SchemaShape>(
	orderBy?: QueryOrderBy<TShape>[],
): SqlResult | undefined => commonOrderBy(orderBy, fieldToStr);

export const toSql = <TShape extends SchemaShape>(
	json: QuerySchema<TShape>,
): SqlResult =>
	toSqlGeneric(json, fieldToStr, (w) =>
		commonBuildWhere(w, fieldToStr, () => '?'),
	);
