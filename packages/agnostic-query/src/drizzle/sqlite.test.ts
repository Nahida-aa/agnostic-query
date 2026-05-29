import { Database } from 'bun:sqlite';
import { describe, expect, it } from 'bun:test';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { toDrizzleWhere } from './sqlite.ts';

const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	name: text('name'),
	age: integer('age'),
});

const db = drizzle(new Database(':memory:'));

const toSql = (whereExpr: ReturnType<typeof toDrizzleWhere>) => {
	return db.select().from(users).where(whereExpr).toSQL();
};

describe('toDrizzleWhere (sqlite)', () => {
	it('handles eq', () => {
		const sql = toSql(
			toDrizzleWhere(users, { field: ['name'], op: '=', value: 'Alice' }),
		);
		expect(sql.sql).toBe(
			`select "id", "name", "age" from "users" where "users"."name" = ?`,
		);
		expect(sql.params).toEqual(['Alice']);
	});

	it('handles is null', () => {
		const sql = toSql(
			toDrizzleWhere(users, { field: ['name'], op: 'is null' }),
		);
		expect(sql.sql).toBe(
			`select "id", "name", "age" from "users" where "users"."name" IS NULL`,
		);
		expect(sql.params).toEqual([]);
	});

	it('handles ilike via LOWER(...) LIKE LOWER(...)', () => {
		const sql = toSql(
			toDrizzleWhere(users, {
				field: ['name'],
				op: 'ilike',
				value: '%alice%',
			}),
		);
		expect(sql.sql).toBe(
			`select "id", "name", "age" from "users" where LOWER("users"."name") LIKE LOWER(?)`,
		);
		expect(sql.params).toEqual(['%alice%']);
	});

	it('handles in', () => {
		const sql = toSql(
			toDrizzleWhere(users, {
				field: ['id'],
				op: 'in',
				values: ['1', '2', '3'],
			}),
		);
		expect(sql.sql).toBe(
			`select "id", "name", "age" from "users" where "users"."id" in (?, ?, ?)`,
		);
		expect(sql.params).toEqual(['1', '2', '3']);
	});
});
