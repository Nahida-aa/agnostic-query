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
import type { QueryWhere, UnaryComparisonOp } from './core/where.ts';

export const drizzleOps = {
	eq,
	gt,
	gte,
	lt,
	lte,
	like,
	ilike,
} satisfies Record<UnaryComparisonOp, (column: any, value: any) => SQL>;

const isTuple = (v: any): v is any[] => Array.isArray(v);

const _toDrizzleWhere = (
	table: any,
	where: QueryWhere | null,
): SQL | undefined => {
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

	const node = where as any;
	const fieldKey = isTuple(node.field) ? node.field[0] : node.field;
	const column = table[fieldKey];

	if (!column) {
		console.warn(`Field ${String(fieldKey)} does not exist on table`);
		return;
	}

	if (node.op === 'in') {
		if (!Array.isArray(node.values)) {
			console.warn(`Operator 'in' requires an array value`);
			return undefined;
		}
		return inArray(column, node.values);
	}
	const opFn = drizzleOps[node.op as UnaryComparisonOp];
	if (!opFn) return undefined;
	return opFn(column, node.value);
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

export const toDrizzleOrderBy = <TShape>(
	table: any,
	orderBy: QueryOrderBy<TShape>[] | null,
): any[] | undefined => {
	if (!orderBy) return undefined;
	const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
	return clauses.map((c) => {
		const fieldKey = isTuple(c.field) ? c.field[0] : c.field;
		const col = table[String(fieldKey)];
		const fn = c.direction === 'desc' ? desc : asc;
		return fn(col);
	});
};
