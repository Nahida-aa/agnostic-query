import { Database } from 'bun:sqlite';
import { describe, expect, it } from 'bun:test';
import { aq, type QuerySchema } from '../core/index.ts';
import { toDb0, toDb0OrderBy, toDb0Where } from './sqlite.ts';

describe('toDb0Where', () => {
	it('uses ? placeholders', () => {
		const result = toDb0Where({ field: ['name'], op: '=', value: 'Alice' });
		expect(result).toEqual({ sql: '"name" = ?', params: ['Alice'] });
	});

	it('formats nested sqlite JSON paths', () => {
		const result = toDb0Where({
			field: ['data', 'address', 'city'],
			op: '=',
			value: 'NYC',
		});
		expect(result).toEqual({
			sql: 'json_extract("data", \'$.address.city\') = ?',
			params: ['NYC'],
		});
	});

	it('returns undefined for missing where', () => {
		expect(toDb0Where(undefined)).toBeUndefined();
	});
});

describe('toDb0OrderBy', () => {
	it('formats a single clause', () => {
		const result = toDb0OrderBy([{ field: ['name'], direction: 'asc' }]);
		expect(result).toEqual({ sql: '"name" ASC', params: [] });
	});

	it('formats multiple clauses', () => {
		const result = toDb0OrderBy([
			{ field: ['name'], direction: 'desc' },
			{ field: ['age'], direction: 'asc' },
		]);
		expect(result).toEqual({
			sql: '"name" DESC, "age" ASC',
			params: [],
		});
	});

	it('returns undefined for null', () => {
		expect(toDb0OrderBy(null)).toBeUndefined();
	});
});

describe('toDb0', () => {
	it('executes against a real in-memory sqlite database', () => {
		const db = new Database(':memory:');
		db.exec(`
			CREATE TABLE users (
				name TEXT NOT NULL,
				age INTEGER NOT NULL
			);
			INSERT INTO users (name, age) VALUES
				('Alice', 18),
				('Alice', 19),
				('Alice', 20),
				('Alice', 21),
				('Alice', 22),
				('Alice', 23),
				('Alice', 24),
				('Alice', 25),
				('Bob', 30);
		`);

		const schema = aq<{ name: string; age: number }>({ table: 'users' })
			.where('name', '=', 'Alice')
			.where('age', '>', 18)
			.orderBy('age', 'asc')
			.limit(10)
			.offset(5)
			.toJSON();

		const rows = toDb0(db, schema);
		expect(rows).toEqual([
			{ name: 'Alice', age: 24 },
			{ name: 'Alice', age: 25 },
		]);
	});

	it('returns all rows when where is empty', async () => {
		const db = new Database(':memory:');
		db.exec(`
			CREATE TABLE users (
				name TEXT NOT NULL,
				age INTEGER NOT NULL
			);
			INSERT INTO users (name, age) VALUES
				('Alice', 18),
				('Bob', 30),
				('Carol', 27);
		`);

		const schema: QuerySchema = {
			table: 'users',
			where: null,
		};
		const rows = await toDb0(db, schema);
		expect(rows).toHaveLength(3);
		expect(rows).toContainEqual({ name: 'Alice', age: 18 });
		expect(rows).toContainEqual({ name: 'Bob', age: 30 });
		expect(rows).toContainEqual({ name: 'Carol', age: 27 });
	});
});
