import type { QuerySchema } from '../core/index.ts';
import type { QueryOrderBy } from '../core/order-by.ts';
import type { FieldPath, SchemaShape } from '../core/schema.ts';
import type { QueryWhere } from '../core/where.ts';
import { isComparisonWhere } from '../core/where.ts';
import type { SqlResult } from './types.ts';

export const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`;

export const buildWhere = (
	where: QueryWhere,
	fieldToStr: (f: FieldPath) => string,
	placeholderForIndex: (i: number) => string,
	startIndex = 1,
): SqlResult | undefined => {
	if (where.op === 'not') {
		const inner = buildWhere(
			where.condition,
			fieldToStr,
			placeholderForIndex,
			startIndex,
		);
		if (!inner) return;
		return { sql: `NOT (${inner.sql})`, params: inner.params };
	}

	if (where.op === 'and' || where.op === 'or') {
		let idx = startIndex;
		const parts = where.conditions
			.map((c) => {
				const res = buildWhere(c, fieldToStr, placeholderForIndex, idx);
				if (res) idx = idx + res.params.length;
				return res;
			})
			.filter((c): c is SqlResult => c !== undefined);
		if (parts.length === 0) return;
		const joiner = ` ${where.op.toUpperCase()} `;
		const sql = parts.map((p) => p.sql).join(joiner);
		return {
			sql: parts.length > 1 ? `(${sql})` : sql,
			params: parts.flatMap((p) => p.params),
		};
	}

	if (!isComparisonWhere(where)) return;
	const fieldStr = fieldToStr(where.field);

	if (where.op === 'in') {
		const placeholders = where.values
			.map((_, i) => placeholderForIndex(i + startIndex))
			.join(', ');
		return { sql: `${fieldStr} IN (${placeholders})`, params: where.values };
	}

	if (where.op === 'is null') {
		return { sql: `${fieldStr} IS NULL`, params: [] };
	}

	return {
		sql: `${fieldStr} ${where.op} ${placeholderForIndex(startIndex)}`,
		params: [where.value],
	};
};

export const toSqlOrderBy = <TShape extends SchemaShape>(
	orderBy: QueryOrderBy<TShape>[] | undefined,
	fieldToStr: (f: FieldPath) => string,
): SqlResult | undefined => {
	if (!orderBy) return;
	return {
		sql: orderBy
			.map((c) => `${fieldToStr(c.field)} ${c.direction.toUpperCase()}`)
			.join(', '),
		params: [],
	};
};

export const _toSql = <TShape extends SchemaShape>(
	json: QuerySchema<TShape>,
	fieldToStr: (f: FieldPath) => string,
	buildWhereFn: (w: QueryWhere, start?: number) => SqlResult | undefined,
): SqlResult => {
	if (!json.table) throw new Error('Table name is required');
	const where = json.where ? buildWhereFn(json.where) : undefined;
	const orderBy = json.orderBy?.length
		? toSqlOrderBy(json.orderBy, fieldToStr)
		: undefined;
	const parts = [
		`SELECT * FROM ${quoteIdent(json.table)}`,
		where ? `WHERE ${where.sql}` : '',
		orderBy ? `ORDER BY ${orderBy.sql}` : '',
		json.limit !== undefined ? `LIMIT ${json.limit}` : '',
		json.offset !== undefined ? `OFFSET ${json.offset}` : '',
	].filter(Boolean);
	return {
		sql: parts.join(' '),
		params: [...(where?.params ?? []), ...(orderBy?.params ?? [])],
	};
};

export type FieldToStr = (f: FieldPath) => string;
