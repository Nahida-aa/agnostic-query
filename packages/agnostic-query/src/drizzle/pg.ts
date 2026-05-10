import {
	and,
	asc,
	type ColumnsSelection,
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
import type { BuildColumns } from 'drizzle-orm/column-builder';
import type { SelectedFields } from 'drizzle-orm/gel-core/query-builders/select.types';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import {
	PgDatabase,
	PgSelectBase,
	type PgTableWithColumns,
} from 'drizzle-orm/pg-core';
import type { PgColumnBuilderBase } from 'drizzle-orm/pg-core/columns/common';
import type { PgSelectBuilder } from 'drizzle-orm/pg-core/query-builders';
import type { PgTable, TableConfig } from 'drizzle-orm/pg-core/table';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { SelectMode } from 'drizzle-orm/query-builders/select.types';
import type { QuerySchema } from '../core/index.ts';
import type { QueryOrderBy } from '../core/order-by.ts';
import type { SchemaShape } from '../core/schema';
import type { QueryWhere, UnaryComparisonOp } from '../core/where.ts';
import { isComparisonWhere } from '../core/where.ts';
import { fieldToStr } from '../sql/pg.ts';

export const drizzleOps = {
	eq,
	gt,
	gte,
	lt,
	lte,
	like,
	ilike,
} satisfies Record<UnaryComparisonOp, (column: any, value: any) => SQL>;

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

	let target: SQL;
	if (segments.length === 0) {
		target = column;
	} else if (segments.every((p) => typeof p === 'number')) {
		target = sql.raw(fieldToStr(where.field));
	} else {
		const parts = segments.map((p) =>
			typeof p === 'number' ? String(p) : `'${p}'`,
		);
		const last = parts.pop()!;
		const prefix = parts.join('->');
		target =
			parts.length > 0
				? sql`${column}->${sql.raw(prefix)}->>${sql.raw(last)}`
				: sql`${column}->>${sql.raw(last)}`;
	}

	if (where.op === 'in') return inArray(target, where.values);
	const opFn = drizzleOps[where.op];
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
	db:
		| PgliteDatabase<Record<string, never>>
		| NeonHttpDatabase<Record<string, never>>,
	table: any,
	querySchema: QuerySchema<TShape>,
) => {
	const query = db
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
