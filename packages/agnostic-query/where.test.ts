import { describe, expect, it } from 'bun:test';
import { findWhereByField, type QueryWhere } from './src/core/where.js';

type UserShape = {
	id: string;
	name: string;
	age: number;
	tags: string[];
};

const base: QueryWhere<UserShape> = {
	field: ['name'],
	op: 'eq',
	value: 'Alice',
};

const multi: QueryWhere<UserShape> = {
	op: 'and',
	conditions: [
		{ field: ['name'], op: 'eq', value: 'Alice' },
		{ field: ['age'], op: 'gt', value: 18 },
	],
};

const unary: QueryWhere<UserShape> = {
	op: 'not',
	condition: { field: ['age'], op: 'lt', value: 18 },
};

describe('findWhereByField', () => {
	it('should find comparison in UnaryComparisonWhere', () => {
		const result = findWhereByField(base).eq(['name']);
		expect((result as any)?.value).toBe('Alice');
	});

	it('should find comparison in MultiLogicalWhere (and)', () => {
		const resultName = findWhereByField(multi).eq(['name']);
		const resultAge = findWhereByField(multi).find(['age'], 'gt');
		expect((resultName as any)?.value).toBe('Alice');
		expect((resultAge as any)?.value).toBe(18);
	});

	it('should find comparison in MultiLogicalWhere (or)', () => {
		const orWhere: QueryWhere<UserShape> = {
			op: 'or',
			conditions: [
				{ field: ['id'], op: 'eq', value: '1' },
				{ field: ['name'], op: 'like', value: '%admin%' },
			],
		};
		expect((findWhereByField(orWhere).eq(['id']) as any)?.value).toBe('1');
		expect((findWhereByField(orWhere).find(['name'], 'like') as any)?.value).toBe('%admin%');
	});

	it('should find comparison in UnaryLogicalWhere (not)', () => {
		const result = findWhereByField(unary).find(['age'], 'lt');
		expect((result as any)?.value).toBe(18);
	});

	it('should return undefined if field not found', () => {
		const result = findWhereByField(base).find(['id']);
		expect(result).toBeUndefined();
	});

	it('should return undefined if where is null', () => {
		const result = findWhereByField<UserShape>(null).eq(['name']);
		expect(result).toBeUndefined();
	});

	it('should handle deeply nested structures', () => {
		const deep: QueryWhere<UserShape> = {
			op: 'and',
			conditions: [
				{
					op: 'or',
					conditions: [
						{ field: ['name'], op: 'eq', value: 'Deep' },
						{ op: 'not', condition: { field: ['age'], op: 'lt', value: 0 } },
					],
				},
				{ field: ['tags'], op: 'in', values: ['a', 'b'] },
			],
		};
		expect((findWhereByField(deep).eq(['name']) as any)?.value).toBe('Deep');
		expect((findWhereByField(deep).find(['age'], 'lt') as any)?.value).toBe(0);
		const tagsNode = findWhereByField(deep).in(['tags']);
		expect((tagsNode as any)?.values).toEqual(['a', 'b']);
	});
});
