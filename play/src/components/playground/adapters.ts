import { PGlite } from '@electric-sql/pglite';
import { fromTanDbWhere } from 'agnostic-query/tanstack-db';
import { createWhereSchema as createValibotSchema } from 'agnostic-query/valibot';
import { createWhereSchema as createZodSchema } from 'agnostic-query/zod';
import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/pglite';
import { safeParse } from 'valibot';
import type { QueryWhere } from '../../../../packages/agnostic-query/src/core/where';
import { toDb0Where } from '../../../../packages/agnostic-query/src/db0/pg';
import { toDrizzleWhere } from '../../../../packages/agnostic-query/src/drizzle/pg';
import { toSqlString } from '../../../../packages/agnostic-query/src/sql/pg';

export type AdapterResult =
	| { status: 'ok'; value: string }
	| { status: 'error'; message: string };

const users = pgTable('users', {
	id: text('id').primaryKey(),
	name: text('name'),
	age: integer('age'),
	role: text('role'),
});

const pglite = new PGlite();
const db = drizzle(pglite, { schema: { users } });

export function runSqlString(input: unknown): AdapterResult {
	try {
		const result = toSqlString(input as any);
		if (!result) return { status: 'error', message: 'undefined input' };
		return {
			status: 'ok',
			value: `SQL:  ${result.sql}\nParams: ${JSON.stringify(result.params)}`,
		};
	} catch (e) {
		return { status: 'error', message: String(e) };
	}
}

export function runDb0(input: unknown): AdapterResult {
	try {
		const result = toDb0Where(input as any);
		if (!result) return { status: 'error', message: 'undefined input' };
		return {
			status: 'ok',
			value: `SQL:  ${result.sql}\nParams: ${JSON.stringify(result.params)}`,
		};
	} catch (e) {
		return { status: 'error', message: String(e) };
	}
}

export type UserShape = { id: string; name: string; age: number; role: string };
const zodSchema = createZodSchema<UserShape>();
const valibotSchema = createValibotSchema<UserShape>();

export function runZod(input: unknown): AdapterResult {
	const result = zodSchema.safeParse(input);
	if (result.success) {
		return { status: 'ok', value: JSON.stringify(result.data, null, 2) };
	}
	return {
		status: 'error',
		message: JSON.stringify(result.error.issues, null, 2),
	};
}

export function runValibot(input: unknown): AdapterResult {
	const result = safeParse(valibotSchema, input);
	if (result.success) {
		return { status: 'ok', value: JSON.stringify(result.output, null, 2) };
	}
	return { status: 'error', message: JSON.stringify(result.issues, null, 2) };
}

export function runFromTanDbWhere(input: unknown): AdapterResult {
	try {
		const result = fromTanDbWhere(input as any);
		if (result === null) return { status: 'error', message: 'null input' };
		return { status: 'ok', value: JSON.stringify(result, null, 2) };
	} catch (e) {
		return { status: 'error', message: String(e) };
	}
}

export function runQueryWhereJson(input: unknown): AdapterResult {
	if (input === null) return { status: 'error', message: 'null input' };
	return { status: 'ok', value: JSON.stringify(input, null, 2) };
}

export function runDrizzle(input: QueryWhere<UserShape> | undefined): AdapterResult {
	try {
		const whereExpr = toDrizzleWhere(users, input);
		if (!whereExpr) return { status: 'error', message: 'null input' };
		const sql = db.select().from(users).where(whereExpr).toSQL();
		return {
			status: 'ok',
			value: `SQL:  ${sql.sql}\nParams: ${JSON.stringify(sql.params)}`,
		};
	} catch (e) {
		return { status: 'error', message: String(e) };
	}
}
