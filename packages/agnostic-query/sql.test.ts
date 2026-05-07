import { describe, expect, it } from 'bun:test';
import { toSqlString } from './src/sql.js';

describe('toSqlString', () => {
	it('eq', () => {
		expect(toSqlString({ field: 'name', operator: 'eq', conditions: "Alice" })).toBe(`"name" = 'Alice'`);
	});

	it('gt', () => {
		expect(toSqlString({ field: 'age', operator: 'gt', conditions: 18 })).toBe(`"age" > 18`);
	});

	it('gte', () => {
		expect(toSqlString({ field: 'age', operator: 'gte', conditions: 18 })).toBe(`"age" >= 18`);
	});

	it('lt', () => {
		expect(toSqlString({ field: 'age', operator: 'lt', conditions: 18 })).toBe(`"age" < 18`);
	});

	it('lte', () => {
		expect(toSqlString({ field: 'age', operator: 'lte', conditions: 18 })).toBe(`"age" <= 18`);
	});

	it('like', () => {
		expect(toSqlString({ field: 'name', operator: 'like', conditions: '%test%' })).toBe(`"name" LIKE '%test%'`);
	});

	it('ilike', () => {
		expect(toSqlString({ field: 'name', operator: 'ilike', conditions: '%Test%' })).toBe(`"name" ILIKE '%Test%'`);
	});

	it('in', () => {
		expect(toSqlString({ field: 'id', operator: 'in', conditions: ["1", "2", "3"] })).toBe(`"id" IN ('1', '2', '3')`);
	});

	it('and', () => {
		const result = toSqlString({
			operator: 'and',
			conditions: [
				{ field: 'name', operator: 'eq', conditions: 'Alice' },
				{ field: 'age', operator: 'gt', conditions: 18 },
			],
		});
		expect(result).toBe(`("name" = 'Alice' AND "age" > 18)`);
	});

	it('or', () => {
		const result = toSqlString({
			operator: 'or',
			conditions: [
				{ field: 'id', operator: 'eq', conditions: '1' },
				{ field: 'id', operator: 'eq', conditions: '2' },
			],
		});
		expect(result).toBe(`("id" = '1' OR "id" = '2')`);
	});

	it('not', () => {
		const result = toSqlString({
			operator: 'not',
			conditions: { field: 'age', operator: 'lt', conditions: 18 },
		});
		expect(result).toBe(`NOT ("age" < 18)`);
	});

	it('nested', () => {
		const result = toSqlString({
			operator: 'and',
			conditions: [
				{
					operator: 'or',
					conditions: [
						{ field: 'name', operator: 'like', conditions: '%test%' },
						{ operator: 'not', conditions: { field: 'age', operator: 'eq', conditions: 0 } },
					],
				},
				{ field: 'id', operator: 'in', conditions: ['a', 'b'] },
			],
		});
		expect(result).toBe(`(("name" LIKE '%test%' OR NOT ("age" = 0)) AND "id" IN ('a', 'b'))`);
	});

	it('handles special chars in strings', () => {
		expect(toSqlString({ field: 'name', operator: 'eq', conditions: "O'Brien" })).toBe(`"name" = 'O''Brien'`);
	});

	it('handles null values', () => {
		expect(toSqlString({ field: 'name', operator: 'eq', conditions: null })).toBe(`"name" = NULL`);
	});

	it('returns null for null input', () => {
		expect(toSqlString(null)).toBeNull();
	});
});
