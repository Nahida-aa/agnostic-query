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
} from 'drizzle-orm';

import type {
	BaseWhere,
	BaseWhereOp,
	QueryWhere,
	SchemaShape,
} from './where.ts';
import type { OrderBy } from './order-by.ts';

export const drizzleOps = {
	eq,
	gt,
	gte,
	lt,
	lte,
	like,
	ilike,
};

const _toDrizzleWhere = (
	table: any,
	where: QueryWhere | null,
): SQL | undefined => {
	if (!where) return undefined;
	if (where.operator === 'not') {
		where.conditions;
		const subCondition = _toDrizzleWhere(table, where.conditions);
		return subCondition ? not(subCondition) : undefined;
	}

	if (where.operator === 'and' || where.operator === 'or') {
		const conditions = where.conditions
			.map((c) => _toDrizzleWhere(table, c))
			.filter((c): c is SQL => !!c);

		if (conditions.length === 0) return undefined;

		return where.operator === 'and' ? and(...conditions) : or(...conditions);
	}

	const { field, operator, conditions } = where as BaseWhere;
	const column = table[field];

	if (!column) {
		console.warn(`Field ${field} does not exist on table`);
		return undefined;
	}

	if (operator === 'in') {
		if (!Array.isArray(conditions)) {
			console.warn(`Operator 'in' requires an array value`);
			return undefined;
		}
		return inArray(column, conditions);
	}
	const opFn = drizzleOps[operator];
	if (!opFn) return undefined;
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
	return and(extraConditions, whereConditions);
};

export const toDrizzleOrderBy = <TShape extends Record<string, any>>(
	table: any,
	orderBy: OrderBy<TShape> | null,
): any[] | undefined => {
	if (!orderBy) return undefined;
	const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
	return clauses.map((c) => {
		const col = table[String(c.field)];
		const fn = c.direction === 'desc' ? desc : asc;
		return fn(col);
	});
};
