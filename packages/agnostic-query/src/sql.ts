import type { OrderBy } from './core/order-by.ts';
import type { QueryWhere } from './core/where.ts';

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
};

const fieldToStr = (field: readonly any[]): string =>
	field.map((p) => (typeof p === 'number' ? `[${p}]` : p)).join('.');

const isTuple = (v: any): v is any[] => Array.isArray(v);

const build = (where: QueryWhere): string | null => {
	if (where.op === 'not') {
		const inner = build(where.condition);
		if (!inner) return null;
		return `NOT (${inner})`;
	}

	if (where.op === 'and' || where.op === 'or') {
		const parts = where.conditions
			.map((c) => build(c))
			.filter((c): c is string => c !== null);
		if (parts.length === 0) return null;
		const joiner = ` ${where.op.toUpperCase()} `;
		const sql = parts.join(joiner);
		return parts.length > 1 ? `(${sql})` : sql;
	}

	const node = where as any;
	if (!isTuple(node.field)) return `"${node.field}"`;

	const fieldStr = fieldToStr(node.field);

	if (node.op === 'in') {
		if (!Array.isArray(node.values)) return null;
		const values = node.values.map(escape).join(', ');
		return `"${fieldStr}" IN (${values})`;
	}

	const sqlOp = sqlOpMap[node.op];
	if (!sqlOp) return null;
	return `"${fieldStr}" ${sqlOp} ${escape(node.value)}`;
};

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
		.map(
			(c) =>
				`"${isTuple(c.field) ? fieldToStr(c.field) : String(c.field)}" ${c.direction.toUpperCase()}`,
		)
		.join(', ');
};
