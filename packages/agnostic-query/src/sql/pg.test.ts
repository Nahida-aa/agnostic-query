import { describe, expect, it } from 'bun:test';
import { toSqlWhere } from './pg.ts';

describe('toSqlWhere', () => {
	it('=', () => {
		expect(toSqlWhere({ field: ['name'], op: '=', value: 'Alice' })).toEqual({
			sql: '"name" = ?',
			params: ['Alice'],
		});
	});

	it('>', () => {
		expect(toSqlWhere({ field: ['age'], op: '>', value: 18 })).toEqual({
			sql: '"age" > ?',
			params: [18],
		});
	});

	it('>=', () => {
		expect(toSqlWhere({ field: ['age'], op: '>=', value: 18 })).toEqual({
			sql: '"age" >= ?',
			params: [18],
		});
	});

	it('<', () => {
		expect(toSqlWhere({ field: ['age'], op: '<', value: 18 })).toEqual({
			sql: '"age" < ?',
			params: [18],
		});
	});

	it('<=', () => {
		expect(toSqlWhere({ field: ['age'], op: '<=', value: 18 })).toEqual({
			sql: '"age" <= ?',
			params: [18],
		});
	});

	it('like', () => {
		expect(
			toSqlWhere({ field: ['name'], op: 'like', value: '%test%' }),
		).toEqual({
			sql: '"name" like ?',
			params: ['%test%'],
		});
	});

	it('ilike', () => {
		expect(
			toSqlWhere({ field: ['name'], op: 'ilike', value: '%Test%' }),
		).toEqual({
			sql: '"name" ilike ?',
			params: ['%Test%'],
		});
	});

	it('is null', () => {
		expect(
			toSqlWhere({ field: ['name'], op: 'is null' }),
		).toEqual({
			sql: '"name" IS NULL',
			params: [],
		});
	});

	it('@> (contains)', () => {
		expect(
			toSqlWhere({ field: ['tags'], op: '@>', value: ['admin'] }),
		).toEqual({
			sql: '"tags" @> ?',
			params: [['admin']],
		});
	});

	it('<@ (contained by)', () => {
		expect(
			toSqlWhere({ field: ['tags'], op: '<@', value: ['admin', 'user'] }),
		).toEqual({
			sql: '"tags" <@ ?',
			params: [['admin', 'user']],
		});
	});

	it('&& (overlaps)', () => {
		expect(
			toSqlWhere({ field: ['tags'], op: '&&', value: ['admin'] }),
		).toEqual({
			sql: '"tags" && ?',
			params: [['admin']],
		});
	});

	it('in', () => {
		expect(
			toSqlWhere({ field: ['id'], op: 'in', values: ['1', '2', '3'] }),
		).toEqual({
			sql: '"id" IN (?, ?, ?)',
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
			sql: '("name" = ? AND "age" > ?)',
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
			sql: '("id" = ? OR "id" = ?)',
			params: ['1', '2'],
		});
	});

	it('not', () => {
		const result = toSqlWhere({
			op: 'not',
			condition: { field: ['age'], op: '<', value: 18 },
		});
		expect(result).toEqual({
			sql: 'NOT ("age" < ?)',
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
			sql: '(("name" like ? OR NOT ("age" = ?)) AND "id" IN (?, ?))',
			params: ['%test%', 0, 'a', 'b'],
		});
	});

	it('handles special chars in strings', () => {
		expect(toSqlWhere({ field: ['name'], op: '=', value: "O'Brien" })).toEqual(
			{
				sql: '"name" = ?',
				params: ["O'Brien"],
			},
		);
	});

	it('handles null values', () => {
		expect(toSqlWhere({ field: ['name'], op: '=', value: null })).toEqual({
			sql: '"name" = ?',
			params: [null],
		});
	});

	it('returns undefined for null input', () => {
		expect(toSqlWhere(null)).toBeUndefined();
	});

	it('handles JSON path with multi-segment field', () => {
		expect(
			toSqlWhere({ field: ['data', 'city'], op: '=', value: 'NYC' }),
		).toEqual({ sql: '"data"->>\'city\' = ?', params: ['NYC'] });
		expect(
			toSqlWhere({
				field: ['data', 'address', 'city'],
				op: '=',
				value: 'NYC',
			}),
		).toEqual({
			sql: "\"data\"->'address'->>'city' = ?",
			params: ['NYC'],
		});
		expect(
			toSqlWhere({ field: ['tags', 0, 'name'], op: '=', value: 'main' }),
		).toEqual({ sql: '"tags"->0->>\'name\' = ?', params: ['main'] });
	});

	it('handles PG array subscript path', () => {
		expect(
			toSqlWhere({ field: ['categories', 0], op: '=', value: 'foo' }),
		).toEqual({ sql: '"categories"[1] = ?', params: ['foo'] });
		expect(
			toSqlWhere({ field: ['matrix', 0, 1] as any, op: '=', value: 42 }),
		).toEqual({ sql: '"matrix"[1][2] = ?', params: [42] });
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
