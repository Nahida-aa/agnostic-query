import { describe, expect, it } from 'bun:test';
import { createWhereSchema } from './zod.ts';

type UserShape = {
	id: string;
	name: string;
	age: number;
	tags: string[];
};

describe('createWhereSchema', () => {
	const fullSchema = createWhereSchema<UserShape>();

	it('should parse valid UnaryComparisonWhere', () => {
		const result = fullSchema.safeParse({ field: ['name'], op: 'eq', value: 'Alice' });
		expect(result.success).toBe(true);
		if (result.success) expect((result.data as any)?.value).toBe('Alice');
	});

	it('should parse valid MultiLogicalWhere (and)', () => {
		const data = {
			op: 'and' as const,
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['age'], op: 'gt', value: 18 },
			],
		};
		const result = fullSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('should parse valid MultiLogicalWhere (or)', () => {
		const data = {
			op: 'or' as const,
			conditions: [{ field: ['id'], op: 'in', values: ['1', '2'] }],
		};
		const result = fullSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('should parse valid UnaryLogicalWhere (not)', () => {
		const data = {
			op: 'not' as const,
			condition: { field: ['age'], op: 'lt', value: 18 },
		};
		const result = fullSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('should parse nested conditions', () => {
		const data = {
			op: 'and' as const,
			conditions: [
				{
					op: 'or' as const,
					conditions: [
						{ field: ['name'], op: 'like', value: '%test%' },
						{ op: 'not', condition: { field: ['age'], op: 'eq', value: 0 } },
					],
				},
				{ field: ['id'], op: 'in', values: ['a', 'b'] },
			],
		};
		const result = fullSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('should accept string field (auto-convert to tuple)', () => {
		const result = fullSchema.safeParse({ field: 'name', op: 'eq', value: 'test' });
		expect(result.success).toBe(true);
	});

	it('should reject invalid operator', () => {
		const result = fullSchema.safeParse({ field: ['name'], op: 'ne', value: 'x' });
		expect(result.success).toBe(false);
	});

	it('should reject non-array conditions for MultiWhere', () => {
		const result = fullSchema.safeParse({ op: 'and', conditions: {} });
		expect(result.success).toBe(false);
	});

	it('should reject missing condition for UnaryWhere', () => {
		const result = fullSchema.safeParse({ op: 'not' });
		expect(result.success).toBe(false);
	});
});
