import type { QueryOrderBy } from '../core/order-by.ts';
import type { FieldPath, SchemaShape } from '../core/schema.ts';
import type { QueryWhere, UnaryComparisonOp } from '../core/where.ts';
import { isComparisonWhere } from '../core/where.ts';

export const sqlOpMap: Record<UnaryComparisonOp, string> = {
	eq: '=',
	gt: '>',
	gte: '>=',
	lt: '<',
	lte: '<=',
	like: 'LIKE',
	ilike: 'ILIKE',
};

const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`;

export const fieldToStr = (field: FieldPath): string => {
	if (field.length === 1) return quoteIdent(field[0]);
	const [root, ...rest] = field;
	if (rest.every((p) => typeof p === 'number')) {
		return `${quoteIdent(root)}${rest.map((i) => `[${i + 1}]`).join('')}`;
	}
	const segStr = rest.map((p) =>
		typeof p === 'number' ? String(p) : `'${p.replace(/'/g, "''")}'`,
	);
	const last = segStr.pop()!;
	const prefix = segStr.join('->');
	return prefix
		? `${quoteIdent(root)}->${prefix}->>${last}`
		: `${quoteIdent(root)}->>${last}`;
};

export type SqlResult = {
	sql: string;
	params: unknown[];
};

const build = (where: QueryWhere): SqlResult | undefined => {
	if (where.op === 'not') {
		const inner = build(where.condition);
		if (!inner) return;
		return { sql: `NOT (${inner.sql})`, params: inner.params };
	}

	if (where.op === 'and' || where.op === 'or') {
		const parts = where.conditions
			.map((c) => build(c))
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
		const placeholders = where.values.map(() => '?').join(', ');
		return { sql: `${fieldStr} IN (${placeholders})`, params: where.values };
	}

	const sqlOp = sqlOpMap[where.op];
	if (!sqlOp) return;
	return { sql: `${fieldStr} ${sqlOp} ?`, params: [where.value] };
};

export const toSqlString = (where?: QueryWhere | null): SqlResult | undefined => {
	if (!where) return;
	return build(where);
};

export const toSqlOrderBy = <TShape extends SchemaShape>(
	orderBy?: QueryOrderBy<TShape>[],
): SqlResult | undefined => {
	if (!orderBy) return;
	return {
		sql: orderBy
			.map((c) => `${fieldToStr(c.field)} ${c.direction.toUpperCase()}`)
			.join(', '),
		params: [],
	};
};
