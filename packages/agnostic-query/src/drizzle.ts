import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	like,
	lt,
	lte,
	not,
	or,
	type SQL,
	sql,
} from 'drizzle-orm';
import type { QueryOrderBy } from './core/order-by.ts';
import type {
	ComparisonWhere,
	QueryWhere,
	UnaryComparisonOp,
} from './core/where.ts';

export const drizzleOps = {
	eq,
	gt,
	gte,
	lt,
	lte,
	like,
	ilike,
} satisfies Record<UnaryComparisonOp, (column: any, value: any) => SQL>;

const _toDrizzleWhere = (table: any, where?: QueryWhere): SQL | undefined => {
	if (!where) return undefined;
	if (where.op === 'not') {
		const subCondition = _toDrizzleWhere(table, where.condition);
		return subCondition ? not(subCondition) : undefined;
	}

	if (where.op === 'and' || where.op === 'or') {
		const conditions = where.conditions
			.map((c) => _toDrizzleWhere(table, c))
			.filter((c): c is SQL => !!c);

		if (conditions.length === 0) return;

		return where.op === 'and' ? and(...conditions) : or(...conditions);
	}

	const node = where as ComparisonWhere; // 不知为何 这里的类型带有 MultiComparisonWhere
	const [rootKey, ...jsonPath] = node.field;
	const column = table[rootKey];

	if (!column) {
		console.warn(`Field ${rootKey} does not exist on table`);
		return;
	}
	// --- 处理 JSON 路径 ---
	let target = column;
	if (jsonPath.length > 0) {
		/**
		 * 对于 PostgreSQL:
		 * 如果是深层路径，我们需要构造类似 table.column->'addr'->>'city' 的表达式
		 * 注意：最后一个操作符通常用 ->> 以获取文本值进行比较
		 */
		const parts = jsonPath.map((p) =>
			typeof p === 'number' ? `[${p}]` : `'${p}'`,
		);
		const last = parts.pop()!;

		// parts 用 -> 连接，最后用 ->>
		// column->'addr'->>'city'
		// column->'tags'->[0]->>'name'
		target =
			parts.length > 0
				? sql`${column}->${sql.raw(parts.join('->'))}->>${sql.raw(last)}`
				: sql`${column}->>${sql.raw(last)}`;
	}
	if (node.op === 'in') return inArray(target, node.values);
	const opFn = drizzleOps[node.op];
	if (!opFn) return;
	return opFn(target, node.value);
};

export const toDrizzleWhere = (
	table: any,
	where?: QueryWhere,
	extraConditions?: SQL,
): SQL | undefined => {
	const whereConditions = _toDrizzleWhere(table, where);
	if (!extraConditions) return whereConditions;
	if (!whereConditions) return extraConditions;
	return and(extraConditions, whereConditions);
};

export const toDrizzleOrderBy = <TShape extends Record<string, any>>(
	table: any,
	orderBy?: QueryOrderBy<TShape>[],
): SQL[] => {
	if (!orderBy) return [];
	return orderBy.map((c) => {
		const fieldKey = c.field[0];
		const col = table[fieldKey];
		const fn = c.direction === 'desc' ? desc : asc;
		return fn(col);
	});
};
