import { describe, expect, it } from 'bun:test';
import { createWhereSchema } from './where';

type UserShape = {
	id: string;
	name: string;
	age: number;
	tags: string[];
};

describe('createWhereSchema', () => {
	const subsetSchema = createWhereSchema<UserShape>()(['name', 'age']);
	const fullSchema = createWhereSchema<UserShape>()(['id', 'name', 'age', 'tags']);

	it('should restrict to a subset of fields (TEnabled ≠ keyof TShape)', () => {
		expect(subsetSchema.safeParse({ field: 'name', operator: 'eq', conditions: 'Alice' }).success).toBe(true);
		expect(subsetSchema.safeParse({ field: 'id', operator: 'eq', conditions: '1' }).success).toBe(false);
	});

	it('should parse valid BaseWhere', () => {
		const result = fullSchema.safeParse({ field: 'name', operator: 'eq', conditions: 'Alice' });
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
		const result = fullSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('should parse valid MultiWhere (or)', () => {
		const data = {
			operator: 'or' as const,
			conditions: [{ field: 'id', operator: 'in', conditions: ['1', '2'] }],
		};
		const result = fullSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('should parse valid UnaryWhere (not)', () => {
		const data = {
			operator: 'not' as const,
			conditions: { field: 'age', operator: 'lt', conditions: 18 },
		};
		const result = fullSchema.safeParse(data);
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
		const result = fullSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('should allow any field when columns is undefined', () => {
		const loose = createWhereSchema<UserShape>()();
		const result = loose.safeParse({ field: 'any_field', operator: 'eq', conditions: 'ok' });
		expect(result.success).toBe(true);
	});

	it('should reject all queries when columns is empty', () => {
		const blocked = createWhereSchema<UserShape>()([]);
		expect(blocked.safeParse({ field: 'name', operator: 'eq', conditions: 'x' }).success).toBe(false);
		expect(blocked.safeParse(null).success).toBe(true);
	});

	it('should reject invalid field', () => {
		const result = fullSchema.safeParse({ field: 'unknown', operator: 'eq', conditions: 'x' });
		expect(result.success).toBe(false);
	});

	it('should reject invalid operator', () => {
		const result = fullSchema.safeParse({ field: 'name', operator: 'ne', conditions: 'x' });
		expect(result.success).toBe(false);
	});

	it('should reject non-array conditions for MultiWhere', () => {
		const result = fullSchema.safeParse({ operator: 'and', conditions: {} });
		expect(result.success).toBe(false);
	});

	it('should reject missing conditions for UnaryWhere', () => {
		const result = fullSchema.safeParse({ operator: 'not' });
		expect(result.success).toBe(false);
	});
});
