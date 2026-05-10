import { describe, expect, it } from 'bun:test';
import { findWhere, newWhere, type QueryWhere } from './where.ts';

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

describe('findWhere', () => {
	it('should find comparison in UnaryComparisonWhere', () => {
		const result = findWhere(base).eq(['name']);
		expect((result as any)?.value).toBe('Alice');
	});

	it('should find comparison in MultiLogicalWhere (and)', () => {
		const resultName = findWhere(multi).eq(['name']);
		const resultAge = findWhere(multi).find(['age'], 'gt');
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
		expect((findWhere(orWhere).eq(['id']) as any)?.value).toBe('1');
		expect((findWhere(orWhere).find(['name'], 'like') as any)?.value).toBe('%admin%');
	});

	it('should find comparison in UnaryLogicalWhere (not)', () => {
		const result = findWhere(unary).find(['age'], 'lt');
		expect((result as any)?.value).toBe(18);
	});

	it('should return undefined if field not found', () => {
		const result = findWhere(base).find(['id']);
		expect(result).toBeUndefined();
	});

	it('should return undefined if where is null', () => {
		const result = findWhere<UserShape>(null).eq(['name']);
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
		expect((findWhere(deep).eq(['name']) as any)?.value).toBe('Deep');
		expect((findWhere(deep).find(['age'], 'lt') as any)?.value).toBe(0);
		const tagsNode = findWhere(deep).in(['tags']);
		expect((tagsNode as any)?.values).toEqual(['a', 'b']);
	});
});

describe('newWhere builder', () => {
	type Shape = {
		id: number;
		name: string;
		age: number;
		status: string;
		role: string;
	};

	it('toJSON returns null initially', () => {
		const result = newWhere<Shape>().toJSON();
		expect(result).toBeNull();
	});

	it('where with col/op/value', () => {
		const result = newWhere<Shape>().where('name', 'eq', 'Alice').toJSON();
		expect(result).toEqual({
			field: ['name'],
			op: 'eq',
			value: 'Alice',
		});
	});

	it('chaining wheres creates AND', () => {
		const result = newWhere<Shape>()
			.where('name', 'eq', 'Alice')
			.where('age', 'gt', 18)
			.toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['age'], op: 'gt', value: 18 },
			],
		});
	});

	it('where with in operator', () => {
		const result = newWhere<Shape>().where('status', 'in', ['a', 'b']).toJSON();
		expect(result).toEqual({
			field: ['status'],
			op: 'in',
			values: ['a', 'b'],
		});
	});

	it('where(null) is a no-op', () => {
		const result = newWhere<Shape>()
			.where(null)
			.where('name', 'eq', 'Alice')
			.toJSON();
		expect(result).toEqual({ field: ['name'], op: 'eq', value: 'Alice' });
	});

	it('where(undefined) is a no-op', () => {
		const result = newWhere<Shape>()
			.where(undefined)
			.where('name', 'eq', 'Alice')
			.toJSON();
		expect(result).toEqual({ field: ['name'], op: 'eq', value: 'Alice' });
	});

	it('callback: or', () => {
		const result = newWhere<Shape>()
			.where(({ or, where }) =>
				or([where('name', 'eq', 'a'), where('name', 'eq', 'b')]),
			)
			.toJSON();
		expect(result).toEqual({
			op: 'or',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'a' },
				{ field: ['name'], op: 'eq', value: 'b' },
			],
		});
	});

	it('callback: and', () => {
		const result = newWhere<Shape>()
			.where(({ and, where }) =>
				and([where('age', 'gte', 18), where('age', 'lt', 65)]),
			)
			.toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['age'], op: 'gte', value: 18 },
				{ field: ['age'], op: 'lt', value: 65 },
			],
		});
	});

	it('callback: not', () => {
		const result = newWhere<Shape>()
			.where(({ not, where }) => not(where('role', 'eq', 'banned')))
			.toJSON();
		expect(result).toEqual({
			op: 'not',
			condition: { field: ['role'], op: 'eq', value: 'banned' },
		});
	});

	it('nested callbacks: and within or', () => {
		const result = newWhere<Shape>()
			.where(({ or, and, where }) =>
				or([
					and([where('role', 'eq', 'admin'), where('status', 'eq', 'active')]),
					where('age', 'gt', 30),
				]),
			)
			.toJSON();
		expect(result).toEqual({
			op: 'or',
			conditions: [
				{
					op: 'and',
					conditions: [
						{ field: ['role'], op: 'eq', value: 'admin' },
						{ field: ['status'], op: 'eq', value: 'active' },
					],
				},
				{ field: ['age'], op: 'gt', value: 30 },
			],
		});
	});

	it('accepts QueryWhere object', () => {
		const roleWhere: QueryWhere<Shape> = {
			field: ['role'],
			op: 'eq',
			value: 'admin',
		};
		const result = newWhere<Shape>()
			.where(roleWhere)
			.where('name', 'eq', 'Alice')
			.toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['role'], op: 'eq', value: 'admin' },
				{ field: ['name'], op: 'eq', value: 'Alice' },
			],
		});
	});

	it('initial state + chaining', () => {
		const initWhere: QueryWhere<Shape> = {
			field: ['status'],
			op: 'eq',
			value: 'active',
		};
		const result = newWhere<Shape>(initWhere)
			.where('age', 'gt', 18)
			.toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['status'], op: 'eq', value: 'active' },
				{ field: ['age'], op: 'gt', value: 18 },
			],
		});
	});

	it('initial state with and + chaining', () => {
		const initWhere: QueryWhere<Shape> = {
			op: 'and',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['status'], op: 'eq', value: 'active' },
			],
		};
		const result = newWhere<Shape>(initWhere)
			.where('age', 'gt', 18)
			.toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['status'], op: 'eq', value: 'active' },
				{ field: ['age'], op: 'gt', value: 18 },
			],
		});
	});

	it('multiple chaining from null init', () => {
		const result = newWhere<Shape>(null)
			.where('name', 'eq', 'Alice')
			.where('age', 'gt', 18)
			.toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['age'], op: 'gt', value: 18 },
			],
		});
	});

	it('tuple path where', () => {
		const result = newWhere<Shape>().where(['name'], 'eq', 'Bob').toJSON();
		expect(result).toEqual({ field: ['name'], op: 'eq', value: 'Bob' });
	});

	it('deeply nested', () => {
		const result = newWhere<Shape>()
			.where(({ or, and, where }) =>
				and([
					or([
						and([where('name', 'eq', 'a'), where('status', 'eq', 'x')]),
						and([where('name', 'eq', 'b'), where('status', 'eq', 'y')]),
					]),
					where('age', 'gte', 18),
				]),
			)
			.toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{
					op: 'or',
					conditions: [
						{
							op: 'and',
							conditions: [
								{ field: ['name'], op: 'eq', value: 'a' },
								{ field: ['status'], op: 'eq', value: 'x' },
							],
						},
						{
							op: 'and',
							conditions: [
								{ field: ['name'], op: 'eq', value: 'b' },
								{ field: ['status'], op: 'eq', value: 'y' },
							],
						},
					],
				},
				{ field: ['age'], op: 'gte', value: 18 },
			],
		});
	});
});
