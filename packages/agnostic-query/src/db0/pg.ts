import type { QueryOrderBy } from '../core/order-by.ts';
import type { QueryWhere } from '../core/where.ts';
import { isComparisonWhere } from '../core/where.ts';
import { fieldToStr, type SqlResult, sqlOpMap } from '../sql/pg.ts';

const build = (where: QueryWhere): SqlResult | undefined => {
	if (!where) return;

	if (where.op === 'not') {
		const inner = build(where.condition);
		if (!inner) return;
		return { sql: `NOT (${inner.sql})`, params: inner.params };
	}

	if (where.op === 'and' || where.op === 'or') {
		const parts = where.conditions
			.map((c) => build(c))
			.filter((c): c is NonNullable<typeof c> => c !== null);
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
		const placeholders = where.values.map(() => '?').join(', ');
		return { sql: `${fieldStr} IN (${placeholders})`, params: where.values };
	}

	const op = sqlOpMap[where.op];
	if (!op) return;
	return { sql: `${fieldStr} ${op} ?`, params: [where.value] };
};

export const toDb0Where = (
	where?: QueryWhere | undefined,
): SqlResult | undefined => {
	if (!where) return;
	return build(where);
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
