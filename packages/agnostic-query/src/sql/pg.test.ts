import { describe, expect, it } from 'bun:test';
import { toSqlWhere } from './pg.ts';

describe('toSqlWhere', () => {
	it('eq', () => {
		expect(toSqlWhere({ field: ['name'], op: 'eq', value: 'Alice' })).toEqual({
			sql: '"name" = ?',
			params: ['Alice'],
		});
	});

	it('gt', () => {
		expect(toSqlWhere({ field: ['age'], op: 'gt', value: 18 })).toEqual({
			sql: '"age" > ?',
			params: [18],
		});
	});

	it('gte', () => {
		expect(toSqlWhere({ field: ['age'], op: 'gte', value: 18 })).toEqual({
			sql: '"age" >= ?',
			params: [18],
		});
	});

	it('lt', () => {
		expect(toSqlWhere({ field: ['age'], op: 'lt', value: 18 })).toEqual({
			sql: '"age" < ?',
			params: [18],
		});
	});

	it('lte', () => {
		expect(toSqlWhere({ field: ['age'], op: 'lte', value: 18 })).toEqual({
			sql: '"age" <= ?',
			params: [18],
		});
	});

	it('like', () => {
		expect(
			toSqlWhere({ field: ['name'], op: 'like', value: '%test%' }),
		).toEqual({
			sql: '"name" LIKE ?',
			params: ['%test%'],
		});
	});

	it('ilike', () => {
		expect(
			toSqlWhere({ field: ['name'], op: 'ilike', value: '%Test%' }),
		).toEqual({
			sql: '"name" ILIKE ?',
			params: ['%Test%'],
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
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['age'], op: 'gt', value: 18 },
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
				{ field: ['id'], op: 'eq', value: '1' },
				{ field: ['id'], op: 'eq', value: '2' },
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
			condition: { field: ['age'], op: 'lt', value: 18 },
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
						{ op: 'not', condition: { field: ['age'], op: 'eq', value: 0 } },
					],
				},
				{ field: ['id'], op: 'in', values: ['a', 'b'] },
			],
		});
		expect(result).toEqual({
			sql: '(("name" LIKE ? OR NOT ("age" = ?)) AND "id" IN (?, ?))',
			params: ['%test%', 0, 'a', 'b'],
		});
	});

	it('handles special chars in strings', () => {
		expect(toSqlWhere({ field: ['name'], op: 'eq', value: "O'Brien" })).toEqual(
			{
				sql: '"name" = ?',
				params: ["O'Brien"],
			},
		);
	});

	it('handles null values', () => {
		expect(toSqlWhere({ field: ['name'], op: 'eq', value: null })).toEqual({
			sql: '"name" = ?',
			params: [null],
		});
	});

	it('returns undefined for null input', () => {
		expect(toSqlWhere(null)).toBeUndefined();
	});

	it('handles JSON path with multi-segment field', () => {
		expect(
			toSqlWhere({ field: ['data', 'city'], op: 'eq', value: 'NYC' }),
		).toEqual({ sql: '"data"->>\'city\' = ?', params: ['NYC'] });
		expect(
			toSqlWhere({
				field: ['data', 'address', 'city'],
				op: 'eq',
				value: 'NYC',
			}),
		).toEqual({
			sql: "\"data\"->'address'->>'city' = ?",
			params: ['NYC'],
		});
		expect(
			toSqlWhere({ field: ['tags', 0, 'name'], op: 'eq', value: 'main' }),
		).toEqual({ sql: '"tags"->0->>\'name\' = ?', params: ['main'] });
	});

	it('handles PG array subscript path', () => {
		expect(
			toSqlWhere({ field: ['categories', 0], op: 'eq', value: 'foo' }),
		).toEqual({ sql: '"categories"[1] = ?', params: ['foo'] });
		expect(
			toSqlWhere({ field: ['matrix', 0, 1] as any, op: 'eq', value: 42 }),
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
