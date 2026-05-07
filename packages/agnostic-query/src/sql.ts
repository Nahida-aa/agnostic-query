import type { QueryWhere, BaseWhere} from './where.ts';
import type { OrderBy } from './order-by.ts';
export const sqlOpMap: Record<string, string> = {
	eq: '=',
	gt: '>',
	gte: '>=',
	lt: '<',
	lte: '<=',
	like: 'LIKE',
	ilike: 'ILIKE',
};
const escape = (value: unknown): string => {
	if (value === null || value === undefined) return 'NULL';
	if (typeof value === 'number') return String(value);
	if (typeof value === 'boolean') return String(value);
	const s = String(value);
	return `'${s.replace(/'/g, "''")}'`;
}

const build = (where: QueryWhere): string | null => {
	if (where.operator === 'not') {
		const inner = build(where.conditions);
		if (!inner) return null;
		return `NOT (${inner})`;
	}

	if (where.operator === 'and' || where.operator === 'or') {
		const parts = where.conditions
			.map((c) => build(c))
			.filter((c): c is string => c !== null);
		if (parts.length === 0) return null;
		const joiner = ` ${where.operator.toUpperCase()} `;
		const sql = parts.join(joiner);
		return parts.length > 1 ? `(${sql})` : sql;
	}

	const { field, operator, conditions } = where as BaseWhere;

	if (operator === 'in') {
		if (!Array.isArray(conditions)) return null;
		const values = conditions.map(escape).join(', ');
		return `"${field}" IN (${values})`;
	}

	const op = sqlOpMap[operator];
	if (!op) return null;

	return `"${field}" ${op} ${escape(conditions)}`;
}

export const toSqlString = (where: QueryWhere | null): string | null => {
	if (!where) return null;
	return build(where);
};

export const toSqlOrderBy = <TShape extends Record<string, any>>(
	orderBy: OrderBy<TShape> | null,
): string | null => {
	if (!orderBy) return null;
	const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
	return clauses
		.map((c) => `"${String(c.field)}" ${c.direction.toUpperCase()}`)
		.join(', ');
};
