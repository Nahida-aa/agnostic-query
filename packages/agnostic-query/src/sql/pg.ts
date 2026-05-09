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

const escapeVal = (value: unknown): string => {
	if (value === null || value === undefined) return 'NULL';
	if (typeof value === 'number') return String(value);
	if (typeof value === 'boolean') return String(value);
	const s = String(value);
	return `'${s.replace(/'/g, "''")}'`;
};

/**
 * 将 FieldPath 转为 PostgreSQL 字段引用。
 *
 * 路径决定语法分支：
 * - 仅首段 → 列名引用 `["name"]` → `"name"`
 * - 首段后全是数字 → PG 数组下标（1-indexed，路径数字 +1）
 *   `["tags", 0]` → `"tags"[1]`
 *   `["mat", 0, 1]` → `"mat"[1][2]`
 * - 首段后有字符串   → JSONB 操作符（`->` 返回 jsonb，`->>` 返回 text）
 *   `["data","city"]` → `"data"->>'city'`
 *   `["data","a","b"]` → `"data"->'a'->>'b'`
 *   `["tags",0,"n"]` → `"tags"->0->>'name'`
 */
export const fieldToStr = (field: FieldPath): string => {
	if (field.length === 1) return `"${field[0]}"`;
	const [root, ...rest] = field;
	if (rest.every((p) => typeof p === 'number')) {
		return `"${root}"${rest.map((i) => `[${i + 1}]`).join('')}`;
	}
	const segStr = rest.map((p) =>
		typeof p === 'number' ? String(p) : `'${p}'`,
	);
	const last = segStr.pop()!;
	const prefix = segStr.join('->');
	return prefix ? `"${root}"->${prefix}->>${last}` : `"${root}"->>${last}`;
};

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
		return `${fieldStr} IN (${values})`;
	}

	const sqlOp = sqlOpMap[where.op];
	if (!sqlOp) return;
	return `${fieldStr} ${sqlOp} ${escapeVal(where.value)}`;
};

export const toSqlString = (where?: QueryWhere | null): string | undefined => {
	if (!where) return;
	if (where.op === 'eq') {
		where.field;
	}
	return build(where);
};

export const toSqlOrderBy = <TShape extends SchemaShape>(
	orderBy?: QueryOrderBy<TShape>[],
): string | undefined => {
	if (!orderBy) return;
	return orderBy
		.map((c) => `${fieldToStr(c.field)} ${c.direction.toUpperCase()}`)
		.join(', ');
};
