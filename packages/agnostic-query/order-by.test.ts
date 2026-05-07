import { describe, expect, it } from 'bun:test';
import { toSqlOrderBy } from './src/sql.ts';
import { toDb0OrderBy } from './src/db0.ts';
import { toDrizzleOrderBy } from './src/drizzle.ts';
import { fromTanDbOrderBy } from './src/tanstack-db.ts';
import type { OrderBy } from './src/order-by.ts';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { pgTable, text, integer } from 'drizzle-orm/pg-core';

type UserShape = { id: string; name: string; age: number; role: string };

const users = pgTable('users', {
	id: text('id').primaryKey(),
	name: text('name'),
	age: integer('age'),
	role: text('role'),
});

const db = drizzle(new PGlite());

describe('toSqlOrderBy', () => {
	it('single clause', () => {
		const result = toSqlOrderBy<UserShape>({
			field: 'name',
			direction: 'asc',
		});
		expect(result).toBe('"name" ASC');
	});

	it('multiple clauses', () => {
		const result = toSqlOrderBy<UserShape>([
			{ field: 'name', direction: 'asc' },
			{ field: 'age', direction: 'desc' },
		]);
		expect(result).toBe('"name" ASC, "age" DESC');
	});

	it('null returns null', () => {
		expect(toSqlOrderBy(null)).toBeNull();
	});
});

describe('toDb0OrderBy', () => {
	it('single clause', () => {
		const result = toDb0OrderBy<UserShape>({
			field: 'name',
			direction: 'asc',
		});
		expect(result).toEqual({ sql: '"name" ASC', params: [] });
	});

	it('multiple clauses', () => {
		const result = toDb0OrderBy<UserShape>([
			{ field: 'name', direction: 'desc' },
			{ field: 'age', direction: 'asc' },
		]);
		expect(result).toEqual({
			sql: '"name" DESC, "age" ASC',
			params: [],
		});
	});

	it('null returns null', () => {
		expect(toDb0OrderBy(null)).toBeNull();
	});
});

describe('toDrizzleOrderBy', () => {
	it('single asc', () => {
		const result = toDrizzleOrderBy<UserShape>(users, {
			field: 'name',
			direction: 'asc',
		});
		const sql = db.select().from(users).orderBy(...result!).toSQL();
		expect(sql.sql).toContain('order by "users"."name"');
	});

	it('single desc', () => {
		const result = toDrizzleOrderBy<UserShape>(users, {
			field: 'age',
			direction: 'desc',
		});
		const sql = db.select().from(users).orderBy(...result!).toSQL();
		expect(sql.sql).toContain('order by "users"."age" desc');
	});

	it('multiple clauses', () => {
		const result = toDrizzleOrderBy<UserShape>(users, [
			{ field: 'name', direction: 'asc' },
			{ field: 'age', direction: 'desc' },
		]);
		const sql = db.select().from(users).orderBy(...result!).toSQL();
		expect(sql.sql).toContain('order by "users"."name" asc, "users"."age" desc');
	});

	it('null returns undefined', () => {
		expect(toDrizzleOrderBy(users, null)).toBeUndefined();
	});
});

describe('fromTanDbOrderBy', () => {
	it('single clause', () => {
		const result = fromTanDbOrderBy<UserShape>({
			field: 'name',
			dir: 'asc',
		});
		expect(result).toEqual({ field: 'name', direction: 'asc' });
	});

	it('array of clauses', () => {
		const result = fromTanDbOrderBy<UserShape>([
			{ field: 'name', dir: 'asc' },
			{ field: 'age', dir: 'desc' },
		]);
		expect(result).toEqual([
			{ field: 'name', direction: 'asc' },
			{ field: 'age', direction: 'desc' },
		]);
	});

	it('null returns null', () => {
		expect(fromTanDbOrderBy(null)).toBeNull();
	});
});

describe('type-level OrderBy', () => {
	it('accepts valid order by', () => {
		const ob: OrderBy<UserShape> = [
			{ field: 'name', direction: 'asc' },
			{ field: 'age', direction: 'desc' },
		];
		expect(Array.isArray(ob)).toBe(true);
	});

	it('accepts single clause', () => {
		const ob: OrderBy<UserShape> = { field: 'name', direction: 'desc' };
		expect(ob.field).toBe('name');
	});
});
