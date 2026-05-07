import { describe, expect, it } from 'bun:test';
import { createWhereSchema } from './where';

type UserShape = {
	id: string;
	name: string;
	age: number;
	tags: string[];
};

describe('createWhereSchema', () => {
	const schema = createWhereSchema<UserShape>()(['id', 'name', 'age', 'tags']);

	it('should parse valid BaseWhere', () => {
		const result = schema.safeParse({ field: 'name', operator: 'eq', conditions: 'Alice' });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data?.conditions).toBe('Alice');
	});

	it('should parse valid MultiWhere (and)', () => {
		const data = {
			operator: 'and' as const,
			conditions: [
				{ field: 'name', operator: 'eq', conditions: 'Alice' },
				{ field: 'age', operator: 'gt', conditions: 18 },
			],
		};
		const result = schema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('should parse valid MultiWhere (or)', () => {
		const data = {
			operator: 'or' as const,
			conditions: [{ field: 'id', operator: 'in', conditions: ['1', '2'] }],
		};
		const result = schema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('should parse valid UnaryWhere (not)', () => {
		const data = {
			operator: 'not' as const,
			conditions: { field: 'age', operator: 'lt', conditions: 18 },
		};
		const result = schema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('should parse nested conditions', () => {
		const data = {
			operator: 'and' as const,
			conditions: [
				{
					operator: 'or' as const,
					conditions: [
						{ field: 'name', operator: 'like', conditions: '%test%' },
						{ operator: 'not', conditions: { field: 'age', operator: 'eq', conditions: 0 } },
					],
				},
				{ field: 'id', operator: 'in', conditions: ['a', 'b'] },
			],
		};
		const result = schema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('should reject invalid field', () => {
		const result = schema.safeParse({ field: 'unknown', operator: 'eq', conditions: 'x' });
		expect(result.success).toBe(false);
	});

	it('should reject invalid operator', () => {
		const result = schema.safeParse({ field: 'name', operator: 'ne', conditions: 'x' });
		expect(result.success).toBe(false);
	});

	it('should reject non-array conditions for MultiWhere', () => {
		const result = schema.safeParse({ operator: 'and', conditions: {} });
		expect(result.success).toBe(false);
	});

	it('should reject missing conditions for UnaryWhere', () => {
		const result = schema.safeParse({ operator: 'not' });
		expect(result.success).toBe(false);
	});
});
