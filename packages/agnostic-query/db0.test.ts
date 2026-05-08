import { describe, expect, it } from 'bun:test';
import { toDb0Where } from './src/db0.ts';

describe('toDb0Where', () => {
	it('should handle eq', () => {
		const result = toDb0Where({ field: ['name'], op: 'eq', value: 'Alice' });
		expect(result).toEqual({ sql: '"name" = ?', params: ['Alice'] });
	});

	it('should handle gt', () => {
		const result = toDb0Where({ field: ['age'], op: 'gt', value: 18 });
		expect(result).toEqual({ sql: '"age" > ?', params: [18] });
	});

	it('should handle gte', () => {
		const result = toDb0Where({ field: ['age'], op: 'gte', value: 18 });
		expect(result).toEqual({ sql: '"age" >= ?', params: [18] });
	});

	it('should handle lt', () => {
		const result = toDb0Where({ field: ['age'], op: 'lt', value: 18 });
		expect(result).toEqual({ sql: '"age" < ?', params: [18] });
	});

	it('should handle lte', () => {
		const result = toDb0Where({ field: ['age'], op: 'lte', value: 18 });
		expect(result).toEqual({ sql: '"age" <= ?', params: [18] });
	});

	it('should handle like', () => {
		const result = toDb0Where({ field: ['name'], op: 'like', value: '%test%' });
		expect(result).toEqual({ sql: '"name" LIKE ?', params: ['%test%'] });
	});

	it('should handle ilike', () => {
		const result = toDb0Where({ field: ['name'], op: 'ilike', value: '%Test%' });
		expect(result).toEqual({ sql: '"name" ILIKE ?', params: ['%Test%'] });
	});

	it('should handle in', () => {
		const result = toDb0Where({ field: ['id'], op: 'in', values: ['1', '2', '3'] });
		expect(result).toEqual({ sql: '"id" IN (?, ?, ?)', params: ['1', '2', '3'] });
	});

	it('should handle and', () => {
		const result = toDb0Where({
			op: 'and',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['age'], op: 'gt', value: 18 },
			],
		});
		expect(result).toEqual({ sql: '("name" = ? AND "age" > ?)', params: ['Alice', 18] });
	});

	it('should handle or', () => {
		const result = toDb0Where({
			op: 'or',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['name'], op: 'eq', value: 'Bob' },
			],
		});
		expect(result).toEqual({ sql: '("name" = ? OR "name" = ?)', params: ['Alice', 'Bob'] });
	});

	it('should handle not', () => {
		const result = toDb0Where({
			op: 'not',
			condition: { field: ['age'], op: 'lt', value: 18 },
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

	it('should return null for null input', () => {
		expect(toDb0Where(null)).toBeNull();
	});

	it('should return null for undefined-like where', () => {
		expect(toDb0Where(null as any)).toBeNull();
	});
});
