import {
	and,
	arrayContained,
	arrayContains,
	arrayOverlaps,
	asc,
	type ColumnsSelection,
	desc,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	isNull,
	like,
	lt,
	lte,
	not,
	or,
	type SQL,
	sql,
} from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { QuerySchema } from '../core/index.ts';
import type { QueryOrderBy } from '../core/order-by.ts';
import type { SchemaShape } from '../core/schema';
import type {
	QueryWhere,
	SetComparisonOp,
	UnaryComparisonOp,
} from '../core/where.ts';
import { isComparisonWhere } from '../core/where.ts';
import { fieldToStr } from '../sql/pg.ts';

export const opMap = {
	'=': eq,
	'>': gt,
	'>=': gte,
	'<': lt,
	'<=': lte,
	like,
	ilike,
} satisfies Record<UnaryComparisonOp, (column: any, value: any) => SQL>;
const setOps = {
	'@>': arrayContains,
	'<@': arrayContained,
	'&&': arrayOverlaps,
};

const _toDrizzleWhere = (
	table: any,
	where?: QueryWhere | null,
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

	if (!isComparisonWhere(where)) return;
	const [rootKey, ...segments] = where.field;
	const column = table[rootKey];

	if (!column) {
		console.warn(`Field ${rootKey} does not exist on table`);
		return;
	}

	const target =
		segments.length === 0 ? column : sql.raw(fieldToStr(where.field));

	if (where.op === 'in') return inArray(target, where.values);
	if (where.op === 'is null') return isNull(target);
	if (where.op in setOps) {
		const opFn = setOps[where.op as SetComparisonOp];
		if (!opFn) return;
		return opFn(target, where.value);
	}
	const opFn = opMap[where.op as UnaryComparisonOp];
	if (!opFn) return;
	return opFn(target, where.value);
};

export const toDrizzleWhere = (
	table: any,
	where?: QueryWhere | null,
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

export const toDrizzle = <TShape extends SchemaShape>(
	db: any,
	table: any,
	querySchema?: QuerySchema<TShape>,
) => {
	if (!querySchema) return db.select().from(table) as Promise<TShape[]>;
	const query = (db as PgDatabase<PgQueryResultHKT, Record<string, any>>)
		.select()
		.from(table)
		.where(toDrizzleWhere(table, querySchema.where))
		.orderBy(...toDrizzleOrderBy(table, querySchema.orderBy));
	if (querySchema.limit && querySchema.offset) {
		return query.limit(querySchema.limit).offset(querySchema.offset) as Promise<
			TShape[]
		>;
	}
	if (querySchema.limit) {
		return query.limit(querySchema.limit) as Promise<TShape[]>;
	}
	if (querySchema.offset) {
		return query.offset(querySchema.offset) as Promise<TShape[]>;
	}
	return query as Promise<TShape[]>;
};
