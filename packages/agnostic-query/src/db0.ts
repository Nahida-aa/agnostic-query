import type { QueryWhere } from './where.js';

const opMap: Record<string, string> = {
	eq: '=',
	gt: '>',
	gte: '>=',
	lt: '<',
	lte: '<=',
	like: 'LIKE',
	ilike: 'ILIKE',
};

function build(where: QueryWhere): { sql: string; params: any[] } | null {
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

	const { field, operator, conditions } = where as any;

	if (operator === 'in') {
		if (!Array.isArray(conditions)) return null;
		const placeholders = conditions.map(() => '?').join(', ');
		return { sql: `"${field}" IN (${placeholders})`, params: conditions };
	}

	const op = opMap[operator];
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
	return build(where);
};
