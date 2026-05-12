import { describe, expect, it } from 'bun:test';
import { toDb0Where } from './pg.ts';

describe('toDb0Where', () => {
	it('should handle eq', () => {
		const result = toDb0Where({ field: ['name'], op: '=', value: 'Alice' });
		expect(result).toEqual({ sql: '"name" = ?', params: ['Alice'] });
	});

	it('should handle gt', () => {
		const result = toDb0Where({ field: ['age'], op: '>', value: 18 });
		expect(result).toEqual({ sql: '"age" > ?', params: [18] });
	});

	it('should handle gte', () => {
		const result = toDb0Where({ field: ['age'], op: '>=', value: 18 });
		expect(result).toEqual({ sql: '"age" >= ?', params: [18] });
	});

	it('should handle lt', () => {
		const result = toDb0Where({ field: ['age'], op: '<', value: 18 });
		expect(result).toEqual({ sql: '"age" < ?', params: [18] });
	});

	it('should handle lte', () => {
		const result = toDb0Where({ field: ['age'], op: '<=', value: 18 });
		expect(result).toEqual({ sql: '"age" <= ?', params: [18] });
	});

	it('should handle like', () => {
		const result = toDb0Where({ field: ['name'], op: 'like', value: '%test%' });
		expect(result).toEqual({ sql: '"name" like ?', params: ['%test%'] });
	});

	it('should handle ilike', () => {
		const result = toDb0Where({ field: ['name'], op: 'ilike', value: '%Test%' });
		expect(result).toEqual({ sql: '"name" ilike ?', params: ['%Test%'] });
	});

	it('should handle is null', () => {
		const result = toDb0Where({ field: ['name'], op: 'is null' });
		expect(result).toEqual({ sql: '"name" IS NULL', params: [] });
	});

	it('should handle @> (contains)', () => {
		const result = toDb0Where({ field: ['tags'], op: '@>', value: ['admin'] });
		expect(result).toEqual({ sql: '"tags" @> ?', params: [['admin']] });
	});

	it('should handle <@ (contained by)', () => {
		const result = toDb0Where({ field: ['tags'], op: '<@', value: ['admin', 'user'] });
		expect(result).toEqual({ sql: '"tags" <@ ?', params: [['admin', 'user']] });
	});

	it('should handle && (overlaps)', () => {
		const result = toDb0Where({ field: ['tags'], op: '&&', value: ['admin'] });
		expect(result).toEqual({ sql: '"tags" && ?', params: [['admin']] });
	});

	it('should handle in', () => {
		const result = toDb0Where({ field: ['id'], op: 'in', values: ['1', '2', '3'] });
		expect(result).toEqual({ sql: '"id" IN (?, ?, ?)', params: ['1', '2', '3'] });
	});

	it('should handle and', () => {
		const result = toDb0Where({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
		expect(result).toEqual({ sql: '("name" = ? AND "age" > ?)', params: ['Alice', 18] });
	});

	it('should handle or', () => {
		const result = toDb0Where({
			op: 'or',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['name'], op: '=', value: 'Bob' },
			],
		});
		expect(result).toEqual({ sql: '("name" = ? OR "name" = ?)', params: ['Alice', 'Bob'] });
	});

	it('should handle not', () => {
		const result = toDb0Where({
			op: 'not',
			condition: { field: ['age'], op: '<', value: 18 },
		});
		expect(result).toEqual({ sql: 'NOT ("age" < ?)', params: [18] });
	});

	it('should handle nested conditions', () => {
		const result = toDb0Where({
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

	it('should return undefined for null input', () => {
		expect(toDb0Where(undefined)).toBeUndefined();
	});

	it('should return undefined for undefined where', () => {
		expect(toDb0Where(undefined)).toBeUndefined();
	});

	it('should handle multi-segment JSON path', () => {
		const result = toDb0Where({
			field: ['data', 'address', 'city'],
			op: '=',
			value: 'NYC',
		});
		expect(result).toEqual({
			sql: `"data"->'address'->>'city' = ?`,
			params: ['NYC'],
		});
	});

	it('should handle PG array subscript path', () => {
		const result = toDb0Where({
			field: ['categories', 0],
			op: '=',
			value: 'foo',
		});
		expect(result).toEqual({
			sql: `"categories"[1] = ?`,
			params: ['foo'],
		});
	});
});

import { toDb0OrderBy } from './pg.ts';

describe('toDb0OrderBy', () => {
	it('single clause', () => {
		const result = toDb0OrderBy([
			{ field: ['name'], direction: 'asc' },
		]);
		expect(result).toEqual({ sql: '"name" ASC', params: [] });
	});

	it('multiple clauses', () => {
		const result = toDb0OrderBy([
			{ field: ['name'], direction: 'desc' },
			{ field: ['age'], direction: 'asc' },
		]);
		expect(result).toEqual({
			sql: '"name" DESC, "age" ASC',
			params: [],
		});
	});

	it('null returns undefined', () => {
		expect(toDb0OrderBy(null)).toBeUndefined();
	});
});
