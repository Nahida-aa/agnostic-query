import { describe, expect, it, expectTypeOf } from 'bun:test';
import { findValueInWhere, type QueryWhere } from './src/core/where.js';

type UserShape = {
	id: string;
	name: string;
	age: number;
	tags: string[];
};

const base: QueryWhere<UserShape, keyof UserShape> = {
	field: 'name',
	operator: 'eq',
	conditions: 'Alice',
};

const multi: QueryWhere<UserShape, keyof UserShape> = {
	operator: 'and',
	conditions: [
		{ field: 'name', operator: 'eq', conditions: 'Alice' },
		{ field: 'age', operator: 'gt', conditions: 18 },
	],
};

const unary: QueryWhere<UserShape, keyof UserShape> = {
	operator: 'not',
	conditions: { field: 'age', operator: 'lt', conditions: 18 },
};

describe('findValueInWhere', () => {
	it('should find value in UnaryComparisonWhere', () => {
		const result = findValueInWhere(base)('name');
		expect(result).toBe('Alice');
		expectTypeOf(result).toExtend<string | undefined>();
	});

	it('should find value in MultiWhere (and)', () => {
		const resultName = findValueInWhere(multi)('name');
		const resultAge = findValueInWhere(multi)('age');
		expect(resultName).toBe('Alice');
		expect(resultAge).toBe(18);
	});

	it('should find value in MultiWhere (or)', () => {
		const orWhere: QueryWhere<UserShape, keyof UserShape> = {
			operator: 'or',
			conditions: [
				{ field: 'id', operator: 'eq', conditions: '1' },
				{ field: 'name', operator: 'like', conditions: '%admin%' },
			],
		};
		expect(findValueInWhere(orWhere)('id')).toBe('1');
		expect(findValueInWhere(orWhere)('name')).toBe('%admin%');
	});

	it('should find value in UnaryWhere (not)', () => {
		const result = findValueInWhere(unary)('age');
		expect(result).toBe(18);
	});

	it('should return undefined if field not found', () => {
		// @ts-expect-error - field 'id' is not in base's TEnabled
		const result = findValueInWhere(base)('id');
		expect(result).toBeUndefined();
	});

	it('should return undefined if where is null', () => {
		const result = findValueInWhere<UserShape, keyof UserShape>(null)('name');
		expect(result).toBeUndefined();
	});

	it('should handle deeply nested structures', () => {
		const deep: QueryWhere<UserShape, keyof UserShape> = {
			operator: 'and',
			conditions: [
				{
					operator: 'or',
					conditions: [
						{ field: 'name', operator: 'eq', conditions: 'Deep' },
						{ operator: 'not', conditions: { field: 'age', operator: 'lt', conditions: 0 } },
					],
				},
				{ field: 'tags', operator: 'in', conditions: ['a', 'b'] },
			],
		};
		expect(findValueInWhere(deep)('name')).toBe('Deep');
		expect(findValueInWhere(deep)('age')).toBe(0);
		expect(findValueInWhere(deep)('tags')).toEqual(['a', 'b']);
	});
});
