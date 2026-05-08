import type { OrderBy } from './core/order-by.ts';
import type { QueryWhere } from './core/where.ts';
import { sqlOpMap } from './sql.js';

const fieldToStr = (field: readonly any[]): string =>
	field.map((p) => (typeof p === 'number' ? `[${p}]` : p)).join('.');

const isTuple = (v: any): v is any[] => Array.isArray(v);

const build = (where: QueryWhere): { sql: string; params: any[] } | null => {
	if (!where) return null;

	if (where.op === 'not') {
		const inner = build(where.condition);
		if (!inner) return null;
		return { sql: `NOT (${inner.sql})`, params: inner.params };
	}

	if (where.op === 'and' || where.op === 'or') {
		const parts = where.conditions
			.map((c) => build(c))
			.filter((c): c is NonNullable<typeof c> => c !== null);
		if (parts.length === 0) return null;
		const joiner = ` ${where.op.toUpperCase()} `;
		const sql = parts.map((p) => p.sql).join(joiner);
		return {
			sql: parts.length > 1 ? `(${sql})` : sql,
			params: parts.flatMap((p) => p.params),
		};
	}

	const node = where as any;
	if (!isTuple(node.field)) {
		return { sql: `"${node.field}"`, params: [] };
	}

	const fieldStr = fieldToStr(node.field);

	if (node.op === 'in') {
		if (!Array.isArray(node.values)) return null;
		const placeholders = node.values.map(() => '?').join(', ');
		return {
			sql: `"${fieldStr}" IN (${placeholders})`,
			params: node.values,
		};
	}

	const op = sqlOpMap[node.op];
	if (!op) return null;
	return { sql: `"${fieldStr}" ${op} ?`, params: [node.value] };
};

export type Db0Where = {
	sql: string;
	params: any[];
};

export const toDb0Where = (where: QueryWhere | null): Db0Where | null => {
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
			.map(
				(c) =>
					`"${isTuple(c.field) ? fieldToStr(c.field) : String(c.field)}" ${c.direction.toUpperCase()}`,
			)
			.join(', '),
		params: [],
	};
};
