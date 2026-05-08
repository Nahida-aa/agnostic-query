import { describe, expect, it } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { toDrizzleWhere } from './src/drizzle.ts';

const users = pgTable('users', {
	id: text('id').primaryKey(),
	name: text('name'),
	age: integer('age'),
	tags: text('tags').array(),
});

const db = drizzle(new PGlite());

const toSql = (whereExpr: ReturnType<typeof toDrizzleWhere>) => {
	return db.select().from(users).where(whereExpr).toSQL();
}

describe('toDrizzleWhere', () => {
	it('eq', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['name'], op: 'eq', value: 'Alice' }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where "users"."name" = $1`);
		expect(sql.params).toEqual(['Alice']);
	});

	it('gt', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['age'], op: 'gt', value: 18 }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where "users"."age" > $1`);
		expect(sql.params).toEqual([18]);
	});

	it('gte', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['age'], op: 'gte', value: 18 }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where "users"."age" >= $1`);
	});

	it('lt', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['age'], op: 'lt', value: 18 }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where "users"."age" < $1`);
	});

	it('lte', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['age'], op: 'lte', value: 18 }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where "users"."age" <= $1`);
	});

	it('like', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['name'], op: 'like', value: '%test%' }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where "users"."name" like $1`);
	});

	it('ilike', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['name'], op: 'ilike', value: '%Test%' }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where "users"."name" ilike $1`);
	});

	it('in', () => {
		const sql = toSql(toDrizzleWhere(users, { field: ['id'], op: 'in', values: ['1', '2', '3'] }));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where "users"."id" in ($1, $2, $3)`);
		expect(sql.params).toEqual(['1', '2', '3']);
	});

	it('and', () => {
		const sql = toSql(toDrizzleWhere(users, {
			op: 'and',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['age'], op: 'gt', value: 18 },
			],
		}));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where ("users"."name" = $1 and "users"."age" > $2)`);
		expect(sql.params).toEqual(['Alice', 18]);
	});

	it('or', () => {
		const sql = toSql(toDrizzleWhere(users, {
			op: 'or',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['name'], op: 'eq', value: 'Bob' },
			],
		}));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where ("users"."name" = $1 or "users"."name" = $2)`);
	});

	it('not', () => {
		const sql = toSql(toDrizzleWhere(users, {
			op: 'not',
			condition: { field: ['age'], op: 'lt', value: 18 },
		}));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where not "users"."age" < $1`);
	});

	it('nested and/or/not', () => {
		const sql = toSql(toDrizzleWhere(users, {
			op: 'and',
			conditions: [
				{
					op: 'or',
					conditions: [
						{ field: ['name'], op: 'like', value: '%test%' },
						{ op: 'not', condition: { field: ['age'], op: 'eq', value: 0 } },
					],
				},
				{ field: ['id'], op: 'in', values: ['a', 'b'] },
			],
		}));
		expect(sql.sql).toBe(`select "id", "name", "age", "tags" from "users" where (("users"."name" like $1 or not "users"."age" = $2) and "users"."id" in ($3, $4))`);
	});

	it('null input returns undefined', () => {
		expect(toDrizzleWhere(users, null)).toBeUndefined();
	});

	it('returns undefined for non-existent column', () => {
		expect(toDrizzleWhere(users, { field: ['unknown'], op: 'eq', value: 'x' } as any)).toBeUndefined();
	});
});
