import type { QueryWhere, BaseWhere, } from './where.ts';
import { sqlOpMap } from './sql.js';
import type { OrderBy } from './order-by.ts';

const build = (where: QueryWhere): { sql: string; params: any[] } | null => {
	if (!where) return null;

	if (where.operator === 'not') {
		const inner = build(where.conditions);
		if (!inner) return null;
		return { sql: `NOT (${inner.sql})`, params: inner.params };
	}

	if (where.operator === 'and' || where.operator === 'or') {
		const parts = where.conditions
			.map((c) => build(c))
			.filter((c): c is NonNullable<typeof c> => c !== null);
		if (parts.length === 0) return null;
		const joiner = ` ${where.operator.toUpperCase()} `;
		const sql = parts.map((p) => p.sql).join(joiner);
		return {
			sql: parts.length > 1 ? `(${sql})` : sql,
			params: parts.flatMap((p) => p.params),
		};
	}

	const { field, operator, conditions } = where as BaseWhere

	if (operator === 'in') {
		if (!Array.isArray(conditions)) return null;
		const placeholders = conditions.map(() => '?').join(', ');
		return { sql: `"${field}" IN (${placeholders})`, params: conditions };
	}

	const op = sqlOpMap[operator];
	if (!op) return null;

	return { sql: `"${field}" ${op} ?`, params: [conditions] };
}

export type Db0Where = {
	sql: string;
	params: any[];
};

export const toDb0Where = (
	where: QueryWhere | null,
): Db0Where | null => {
	if (!where) return null;
	return build(where);
};

export type Db0OrderBy = {
	sql: string;
	params: any[];
};

export const toDb0OrderBy = <TShape extends Record<string, any>>(
	orderBy: OrderBy<TShape> | null,
): Db0OrderBy | null => {
	if (!orderBy) return null;
	const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
	return {
		sql: clauses
			.map((c) => `"${String(c.field)}" ${c.direction.toUpperCase()}`)
			.join(', '),
		params: [],
	};
};
