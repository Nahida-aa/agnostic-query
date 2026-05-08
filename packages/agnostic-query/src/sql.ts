import type { QueryOrderBy } from './core/order-by.ts';
import type { FieldPath, SchemaShape } from './core/schema.ts';
import type {
	ComparisonWhere,
	QueryWhere,
	UnaryComparisonOp,
} from './core/where.ts';
import { isComparisonWhere } from './core/where.ts';

export const sqlOpMap: Record<UnaryComparisonOp, string> = {
	eq: '=',
	gt: '>',
	gte: '>=',
	lt: '<',
	lte: '<=',
	like: 'LIKE',
	ilike: 'ILIKE',
};

const escapeVal = (value: unknown): string => {
	if (value === null || value === undefined) return 'NULL';
	if (typeof value === 'number') return String(value);
	if (typeof value === 'boolean') return String(value);
	const s = String(value);
	return `'${s.replace(/'/g, "''")}'`;
};

const fieldToStr = (field: FieldPath): string =>
	field.map((p) => (typeof p === 'number' ? `[${p}]` : p)).join('.');

const build = (where: QueryWhere): string | undefined => {
	if (where.op === 'not') {
		const inner = build(where.condition);
		if (!inner) return;
		return `NOT (${inner})`;
	}
	if (where.op === 'and' || where.op === 'or') {
		const parts = where.conditions
			.map((c) => build(c))
			.filter((c): c is string => c !== undefined);
		if (parts.length === 0) return;
		const joiner = ` ${where.op.toUpperCase()} `;
		const sql = parts.join(joiner);
		return parts.length > 1 ? `(${sql})` : sql;
	}
	if (!isComparisonWhere(where)) return; // TS 无法消除 MultiLogicalWhere（op 是 'and'|'or' union），需要 cast 或其他方法
	const fieldStr = fieldToStr(where.field);

	if (where.op === 'in') {
		const values = where.values.map(escapeVal).join(', ');
		return `"${fieldStr}" IN (${values})`;
	}

	const sqlOp = sqlOpMap[where.op];
	if (!sqlOp) return;
	return `"${fieldStr}" ${sqlOp} ${escapeVal(where.value)}`;
};

export const toSqlString = (where: QueryWhere | null): string | undefined => {
	if (!where) return;
	return build(where);
};

export const toSqlOrderBy = <TShape extends SchemaShape>(
	orderBy?: QueryOrderBy<TShape>[],
): string | undefined => {
	if (!orderBy) return;
	return orderBy
		.map((c) => `"${fieldToStr(c.field)}" ${c.direction.toUpperCase()}`)
		.join(', ');
};
