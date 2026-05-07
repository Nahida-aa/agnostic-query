import {
	and,
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
} from 'drizzle-orm';

import type {
	BaseWhere,
	BaseWhereOp,
	QueryWhere,
	SchemaShape,
} from '@agnostic-query/core';

// 映射 BaseFilterOp 到 Drizzle 的操作符
export const drizzleOps = {
	eq,
	gt,
	gte,
	lt,
	lte,
	like,
	ilike,
	// in: inArray, // 注意：Drizzle 里叫 inArray
};

/**
 * @param table Drizzle 的表对象 (例如 users)
 * @param filter 遵循你定义的 QueryWhere 结构的 JSON
 */
const _toDrizzleWhere = (
	table: any,
	where: QueryWhere | null,
): SQL | undefined => {
	if (!where) return undefined;
	// 1. 处理 一元过滤器 (UnaryFilter: not)
	if (where.operator === 'not') {
		where.conditions;
		const subCondition = _toDrizzleWhere(table, where.conditions);
		return subCondition ? not(subCondition) : undefined;
	}

	// 2. 处理 多元过滤器 (MultiFilter: and, or)
	if (where.operator === 'and' || where.operator === 'or') {
		// 递归解析所有子条件，过滤掉无效的 undefined
		const conditions = where.conditions
			.map((c) => _toDrizzleWhere(table, c))
			.filter((c): c is SQL => !!c);

		if (conditions.length === 0) return undefined;

		return where.operator === 'and' ? and(...conditions) : or(...conditions);
	}

	// 3. 处理 基础过滤器 (BaseFilter)
	const { field, operator, conditions } = where as BaseWhere;
	const column = table[field];

	if (!column) {
		console.warn(`字段 ${field} 在表中不存在`);
		return undefined;
	}

	if (operator === 'in') {
		if (!Array.isArray(conditions)) {
			console.warn(`操作符 'in' 需要一个数组值`);
			return undefined;
		}
		return inArray(column, conditions);
	}
	const opFn = drizzleOps[operator];
	if (!opFn) return undefined;
	// 执行 Drizzle 函数，例如 eq(table.name, 'Alice')
	return opFn(column, conditions);
};

export const toDrizzleWhere = (
	table: any,
	where: QueryWhere | null,
	extraConditions?: SQL,
): SQL | undefined => {
	const whereConditions = _toDrizzleWhere(table, where);
	if (!extraConditions) return whereConditions;
	if (!whereConditions) return extraConditions;

	// 例如 用户想要 查询 已拒绝 行, 如果 额外条件 加入  (status = 'accepted') 就会导致 查询 到 [] , 用于 避免 用户 查询 到 不应该看到的数据(status = 'accepted')
	// WHERE (status = 'rejected') AND (status = 'accepted')
	return and(extraConditions, whereConditions);
};
