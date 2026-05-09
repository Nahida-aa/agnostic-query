import { describe, expect, it } from 'bun:test';
import { toSqlString } from './src/sql/pg.js';

describe('toSqlString', () => {
	it('eq', () => {
		expect(toSqlString({ field: ['name'], op: 'eq', value: 'Alice' })).toBe(`"name" = 'Alice'`);
	});

	it('gt', () => {
		expect(toSqlString({ field: ['age'], op: 'gt', value: 18 })).toBe(`"age" > 18`);
	});

	it('gte', () => {
		expect(toSqlString({ field: ['age'], op: 'gte', value: 18 })).toBe(`"age" >= 18`);
	});

	it('lt', () => {
		expect(toSqlString({ field: ['age'], op: 'lt', value: 18 })).toBe(`"age" < 18`);
	});

	it('lte', () => {
		expect(toSqlString({ field: ['age'], op: 'lte', value: 18 })).toBe(`"age" <= 18`);
	});

	it('like', () => {
		expect(toSqlString({ field: ['name'], op: 'like', value: '%test%' })).toBe(`"name" LIKE '%test%'`);
	});

	it('ilike', () => {
		expect(toSqlString({ field: ['name'], op: 'ilike', value: '%Test%' })).toBe(`"name" ILIKE '%Test%'`);
	});

	it('in', () => {
		expect(toSqlString({ field: ['id'], op: 'in', values: ['1', '2', '3'] })).toBe(`"id" IN ('1', '2', '3')`);
	});

	it('and', () => {
		const result = toSqlString({
			op: 'and',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['age'], op: 'gt', value: 18 },
			],
		});
		expect(result).toBe(`("name" = 'Alice' AND "age" > 18)`);
	});

	it('or', () => {
		const result = toSqlString({
			op: 'or',
			conditions: [
				{ field: ['id'], op: 'eq', value: '1' },
				{ field: ['id'], op: 'eq', value: '2' },
			],
		});
		expect(result).toBe(`("id" = '1' OR "id" = '2')`);
	});

	it('not', () => {
		const result = toSqlString({
			op: 'not',
			condition: { field: ['age'], op: 'lt', value: 18 },
		});
		expect(result).toBe(`NOT ("age" < 18)`);
	});

	it('nested', () => {
		const result = toSqlString({
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
		expect(result).toBe(`(("name" LIKE '%test%' OR NOT ("age" = 0)) AND "id" IN ('a', 'b'))`);
	});

	it('handles special chars in strings', () => {
		expect(toSqlString({ field: ['name'], op: 'eq', value: "O'Brien" })).toBe(`"name" = 'O''Brien'`);
	});

	it('handles null values', () => {
		expect(toSqlString({ field: ['name'], op: 'eq', value: null })).toBe(`"name" = NULL`);
	});

	it('returns undefined for null input', () => {
		expect(toSqlString(null)).toBeUndefined();
	});

	it('handles JSON path with multi-segment field', () => {
		expect(
			toSqlString({ field: ['data', 'city'], op: 'eq', value: 'NYC' }),
		).toBe(`"data"->>'city' = 'NYC'`);
		expect(
			toSqlString({
				field: ['data', 'address', 'city'],
				op: 'eq',
				value: 'NYC',
			}),
		).toBe(`"data"->'address'->>'city' = 'NYC'`);
		expect(
			toSqlString({ field: ['tags', 0, 'name'], op: 'eq', value: 'main' }),
		).toBe(`"tags"->0->>'name' = 'main'`);
	});
});
