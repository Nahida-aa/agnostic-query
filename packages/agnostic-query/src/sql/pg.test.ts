import { describe, expect, it } from 'bun:test';
import { toSql, toSqlWhere } from './pg.ts';

describe('toSqlWhere', () => {
	it('=', () => {
		expect(toSqlWhere({ field: ['name'], op: '=', value: 'Alice' })).toEqual({
			sql: '"name" = $1',
			params: ['Alice'],
		});
	});

	it('>', () => {
		expect(toSqlWhere({ field: ['age'], op: '>', value: 18 })).toEqual({
			sql: '"age" > $1',
			params: [18],
		});
	});

	it('>=', () => {
		expect(toSqlWhere({ field: ['age'], op: '>=', value: 18 })).toEqual({
			sql: '"age" >= $1',
			params: [18],
		});
	});

	it('<', () => {
		expect(toSqlWhere({ field: ['age'], op: '<', value: 18 })).toEqual({
			sql: '"age" < $1',
			params: [18],
		});
	});

	it('<=', () => {
		expect(toSqlWhere({ field: ['age'], op: '<=', value: 18 })).toEqual({
			sql: '"age" <= $1',
			params: [18],
		});
	});

	it('like', () => {
		expect(
			toSqlWhere({ field: ['name'], op: 'like', value: '%test%' }),
		).toEqual({
			sql: '"name" like $1',
			params: ['%test%'],
		});
	});

	it('ilike', () => {
		expect(
			toSqlWhere({ field: ['name'], op: 'ilike', value: '%Test%' }),
		).toEqual({
			sql: '"name" ilike $1',
			params: ['%Test%'],
		});
	});

	it('is null', () => {
		expect(toSqlWhere({ field: ['name'], op: 'is null' })).toEqual({
			sql: '"name" IS NULL',
			params: [],
		});
	});

	it('@> (contains)', () => {
		expect(toSqlWhere({ field: ['tags'], op: '@>', value: ['admin'] })).toEqual(
			{
				sql: '"tags" @> $1',
				params: [['admin']],
			},
		);
	});

	it('<@ (contained by)', () => {
		expect(
			toSqlWhere({ field: ['tags'], op: '<@', value: ['admin', 'user'] }),
		).toEqual({
			sql: '"tags" <@ $1',
			params: [['admin', 'user']],
		});
	});

	it('&& (overlaps)', () => {
		expect(toSqlWhere({ field: ['tags'], op: '&&', value: ['admin'] })).toEqual(
			{
				sql: '"tags" && $1',
				params: [['admin']],
			},
		);
	});

	it('in', () => {
		expect(
			toSqlWhere({ field: ['id'], op: 'in', values: ['1', '2', '3'] }),
		).toEqual({
			sql: '"id" IN ($1, $2, $3)',
			params: ['1', '2', '3'],
		});
	});

	it('and', () => {
		const result = toSqlWhere({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
		expect(result).toEqual({
			sql: '("name" = $1 AND "age" > $2)',
			params: ['Alice', 18],
		});
	});

	it('or', () => {
		const result = toSqlWhere({
			op: 'or',
			conditions: [
				{ field: ['id'], op: '=', value: '1' },
				{ field: ['id'], op: '=', value: '2' },
			],
		});
		expect(result).toEqual({
			sql: '("id" = $1 OR "id" = $2)',
			params: ['1', '2'],
		});
	});

	it('not', () => {
		const result = toSqlWhere({
			op: 'not',
			condition: { field: ['age'], op: '<', value: 18 },
		});
		expect(result).toEqual({
			sql: 'NOT ("age" < $1)',
			params: [18],
		});
	});

	it('nested', () => {
		const result = toSqlWhere({
			op: 'and',
			conditions: [
				{
					op: 'or',
					conditions: [
						{ field: ['name'], op: 'like', value: '%test%' },
						{ op: 'not', condition: { field: ['age'], op: '=', value: 0 } },
					],
				},
				{ field: ['id'], op: 'in', values: ['a', 'b'] },
			],
		});
		expect(result).toEqual({
			sql: '(("name" like $1 OR NOT ("age" = $2)) AND "id" IN ($3, $4))',
			params: ['%test%', 0, 'a', 'b'],
		});
	});

	it('handles special chars in strings', () => {
		expect(toSqlWhere({ field: ['name'], op: '=', value: "O'Brien" })).toEqual({
			sql: '"name" = $1',
			params: ["O'Brien"],
		});
	});

	it('handles null values', () => {
		expect(toSqlWhere({ field: ['name'], op: '=', value: null })).toEqual({
			sql: '"name" = $1',
			params: [null],
		});
	});

	it('returns undefined for null input', () => {
		expect(toSqlWhere(null)).toBeUndefined();
	});

	it('handles JSON path with multi-segment field', () => {
		expect(
			toSqlWhere({ field: ['data', 'city'], op: '=', value: 'NYC' }),
		).toEqual({ sql: '"data"->>\'city\' = $1', params: ['NYC'] });
		expect(
			toSqlWhere({
				field: ['data', 'address', 'city'],
				op: '=',
				value: 'NYC',
			}),
		).toEqual({
			sql: "\"data\"->'address'->>'city' = $1",
			params: ['NYC'],
		});
		expect(
			toSqlWhere({ field: ['tags', 0, 'name'], op: '=', value: 'main' }),
		).toEqual({ sql: '"tags"->0->>\'name\' = $1', params: ['main'] });
	});

	it('handles PG array subscript path', () => {
		expect(
			toSqlWhere({ field: ['categories', 0], op: '=', value: 'foo' }),
		).toEqual({ sql: '"categories"[1] = $1', params: ['foo'] });
		expect(toSqlWhere({ field: ['matrix', 0, 1], op: '=', value: 42 })).toEqual(
			{ sql: '"matrix"[1][2] = $1', params: [42] },
		);
	});
});

import { toSqlOrderBy } from './pg.ts';

describe('toSqlOrderBy', () => {
	it('single clause', () => {
		const result = toSqlOrderBy([{ field: ['name'], direction: 'asc' }]);
		expect(result).toEqual({ sql: '"name" ASC', params: [] });
	});

	it('multiple clauses', () => {
		const result = toSqlOrderBy([
			{ field: ['name'], direction: 'asc' },
			{ field: ['age'], direction: 'desc' },
		]);
		expect(result).toEqual({ sql: '"name" ASC, "age" DESC', params: [] });
	});

	it('null returns undefined', () => {
		expect(toSqlOrderBy(undefined)).toBeUndefined();
	});
});

describe('pglite integration (manual)', () => {
	it('runs a query constructed with ? placeholders against PGlite', async () => {
		// Dynamic imports so this test only fails when explicitly enabled and dependencies are present
		const { PGlite } = await import('@electric-sql/pglite');

		// create DB client directly using PGlite
		const db = new PGlite();

		// create table and insert
		await db.exec(
			`CREATE TABLE IF NOT EXISTS __agnostic_test (id TEXT PRIMARY KEY)`,
		);
		await db.exec(`INSERT INTO __agnostic_test VALUES ('x')`);

		// Build SQL for the test table using toSql (which produces '?' placeholders)
		const sqlRet = toSql({
			table: '__agnostic_test',
			where: { field: ['id'], op: '=', value: 'x' },
		})!;

		// convert '?' placeholders to Postgres-style $1, $2, ... because PGlite expects $n
		const convertQuestionToDollar = (s: string) => {
			let i = 0;
			return s.replace(/\?/g, () => `$${++i}`);
		};

		// const pgSql = convertQuestionToDollar(sqlRet.sql);
		// Execute against PGlite with converted SQL and original params
		const { rows } = await db.query(sqlRet.sql, sqlRet.params);
		expect(Array.isArray(rows)).toBe(true);
		expect(rows.length).toBeGreaterThanOrEqual(1);

		const sql = 'SELECT * FROM __agnostic_test WHERE id = ?';
		const params = ['x'];
		const res = await db.query(convertQuestionToDollar(sql), params); // <- convert ? to $n for PGlite
		expect(Array.isArray(res.rows)).toBe(true);
		expect(res.rows.length).toBeGreaterThanOrEqual(1);
	});
});
