import type { ExpressionBuilder, SelectQueryBuilder, SqlBool } from 'kysely';
import { type ExpressionWrapper, sql } from 'kysely';
import type { QueryOrderBy } from '../core/order-by.ts';
import type { SchemaShape } from '../core/schema.ts';
import type { QueryWhere } from '../core/where.ts';
import { isComparisonWhere } from '../core/where.ts';
import { fieldToStr } from '../sql/pg.ts';
import type { TSelectQueryBuilder } from './types.ts';

const kyselyOpMap = {
	eq: '=',
	gt: '>',
	gte: '>=',
	lt: '<',
	lte: '<=',
	like: 'like',
	ilike: 'ilike',
} as const;

type Expression<TShape, TableName extends string> = ExpressionBuilder<
	{ [k in TableName]: TShape },
	TableName
>;
type BuildResult<TShape, TableName extends string> = (
	expression: Expression<TShape, TableName>,
) => ExpressionWrapper<{ [k in TableName]: TShape }, TableName, SqlBool>;
const emptyExp = <TShape extends SchemaShape, TableName extends string>(
	exp: Expression<TShape, TableName>,
) => exp.and([]);

const build = <TShape extends SchemaShape, TableName extends string>(
	where: QueryWhere<TShape>,
	exp: Expression<TShape, TableName>,
): ExpressionWrapper<{ [k in TableName]: TShape }, TableName, SqlBool> => {
	if (where.op === 'not') {
		const inner = build(where.condition, exp);
		if (!inner) return emptyExp(exp);
		return exp.not(inner);
	}

	if (where.op === 'and' || where.op === 'or') {
		const parts = where.conditions
			.map((c) => build(c, exp))
			.filter((c): c is NonNullable<typeof c> => c !== undefined);

		if (parts.length === 0) return emptyExp(exp);

		return where.op === 'and' ? exp.and(parts) : exp.or(parts);
	}

	if (!isComparisonWhere(where)) return emptyExp(exp);
	const target = sql.raw(fieldToStr(where.field));
	if (where.op === 'in') {
		return exp.eb(target, 'in', where.values);
	}

	const op = kyselyOpMap[where.op];
	if (where.op === 'like' || where.op === 'ilike') {
		return exp.eb(target, op, where.value);
	}
	return exp.eb(target, op, where.value);
};

export const toKyselyWhere = <
	TShape extends Record<string, any>,
	TableName extends string,
>(
	where?: QueryWhere<TShape> | null,
): BuildResult<TShape, TableName> => {
	return (exp: Expression<TShape, TableName>) => {
		if (!where) return emptyExp(exp);
		return build<TShape, TableName>(where, exp);
	};
};

export const toKyselyOrderBy = <
	TShape extends Record<string, any>,
	TableName extends string,
>(
	q: TSelectQueryBuilder<TShape, TableName>,
	orderBy?: QueryOrderBy<TShape>[],
) => {
	if (!orderBy || orderBy.length === 0) return q;
	let currentQuery = q;

	for (const order of orderBy) {
		// 1. 使用你原生的 fieldToStr 生成 PG 語法字串
		const sqlTarget = fieldToStr(order.field);

		// 2. 使用 sql.raw 包裝，告訴 Kysely 這是一段原始 SQL
		// 3. 連續調用 .orderBy
		currentQuery = currentQuery.orderBy(sql.raw(sqlTarget), order.direction);
	}

	return currentQuery;
};
