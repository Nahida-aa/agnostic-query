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
	op: '=',
	value: 'Alice',
};

const multi: QueryWhere<UserShape> = {
	op: 'and',
	conditions: [
		{ field: ['name'], op: '=', value: 'Alice' },
		{ field: ['age'], op: '>', value: 18 },
	],
};

const unary: QueryWhere<UserShape> = {
	op: 'not',
	condition: { field: ['age'], op: '<', value: 18 },
};

describe('findWhere', () => {
	it('should find comparison in UnaryComparisonWhere', () => {
		const result = findWhere(base).eq(['name']);
		expect(result?.value).toBe('Alice');
	});

	it('should find comparison in MultiLogicalWhere (and)', () => {
		const resultName = findWhere(multi).eq(['name']);
		const resultAge = findWhere(multi).find(['age'], '>');
		expect(resultName?.value).toBe('Alice');
		expect(resultAge?.value).toBe(18);
	});

	it('should find comparison in MultiLogicalWhere (or)', () => {
		const orWhere: QueryWhere<UserShape> = {
			op: 'or',
			conditions: [
				{ field: ['id'], op: '=', value: '1' },
				{ field: ['name'], op: 'like', value: '%admin%' },
			],
		};
		expect(findWhere(orWhere).eq(['id'])?.value).toBe('1');
		expect(findWhere(orWhere).find(['name'], 'like')?.value).toBe('%admin%');
	});

	it('should find comparison in UnaryLogicalWhere (not)', () => {
		const result = findWhere(unary).find(['age'], '<');
		expect(result?.value).toBe(18);
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
						{ field: ['name'], op: '=', value: 'Deep' },
						{ op: 'not', condition: { field: ['age'], op: '<', value: 0 } },
					],
				},
				{ field: ['id'], op: 'in', values: ['a', 'b'] },
			],
		};
		expect(findWhere(deep).eq(['name'])?.value).toBe('Deep');
		expect(findWhere(deep).find(['age'], '<')?.value).toBe(0);
		const idNode = findWhere(deep).in(['id']);
		expect(idNode?.values).toEqual(['a', 'b']);
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
		expect(result).toBeUndefined();
	});

	it('where with col/op/value', () => {
		const result = newWhere<Shape>().where('name', '=', 'Alice').toJSON();
		expect(result).toEqual({
			field: ['name'],
			op: '=',
			value: 'Alice',
		});
	});

	it('chaining wheres creates AND', () => {
		const result = newWhere<Shape>()
			.where('name', '=', 'Alice')
			.where('age', '>', 18)
			.toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
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
			.where('name', '=', 'Alice')
			.toJSON();
		expect(result).toEqual({ field: ['name'], op: '=', value: 'Alice' });
	});

	it('where(undefined) is a no-op', () => {
		const result = newWhere<Shape>()
			.where(undefined)
			.where('name', '=', 'Alice')
			.toJSON();
		expect(result).toEqual({ field: ['name'], op: '=', value: 'Alice' });
	});

	it('callback: or', () => {
		const result = newWhere<Shape>()
			.where(({ or, where }) =>
				or([where('name', '=', 'a'), where('name', '=', 'b')]),
			)
			.toJSON();
		expect(result).toEqual({
			op: 'or',
			conditions: [
				{ field: ['name'], op: '=', value: 'a' },
				{ field: ['name'], op: '=', value: 'b' },
			],
		});
	});

	it('callback: and', () => {
		const result = newWhere<Shape>()
			.where(({ and, where }) =>
				and([where('age', '>=', 18), where('age', '<', 65)]),
			)
			.toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['age'], op: '>=', value: 18 },
				{ field: ['age'], op: '<', value: 65 },
			],
		});
	});

	it('callback: not', () => {
		const result = newWhere<Shape>()
			.where(({ not, where }) => not(where('role', '=', 'banned')))
			.toJSON();
		expect(result).toEqual({
			op: 'not',
			condition: { field: ['role'], op: '=', value: 'banned' },
		});
	});

	it('nested callbacks: and within or', () => {
		const result = newWhere<Shape>()
			.where(({ or, and, where }) =>
				or([
					and([where('role', '=', 'admin'), where('status', '=', 'active')]),
					where('age', '>', 30),
				]),
			)
			.toJSON();
		expect(result).toEqual({
			op: 'or',
			conditions: [
				{
					op: 'and',
					conditions: [
						{ field: ['role'], op: '=', value: 'admin' },
						{ field: ['status'], op: '=', value: 'active' },
					],
				},
				{ field: ['age'], op: '>', value: 30 },
			],
		});
	});

	it('accepts QueryWhere object', () => {
		const roleWhere: QueryWhere<Shape> = {
			field: ['role'],
			op: '=',

			value: 'admin',
		};
		const result = newWhere<Shape>()
			.where(roleWhere)
			.where('name', '=', 'Alice')
			.toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['role'], op: '=', value: 'admin' },
				{ field: ['name'], op: '=', value: 'Alice' },
			],
		});
	});

	it('initial state + chaining', () => {
		const initWhere: QueryWhere<Shape> = {
			field: ['status'],
			op: '=',
			value: 'active',
		};
		const result = newWhere<Shape>(initWhere).where('age', '>', 18).toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['status'], op: '=', value: 'active' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
	});

	it('initial state with and + chaining', () => {
		const initWhere: QueryWhere<Shape> = {
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['status'], op: '=', value: 'active' },
			],
		};
		const result = newWhere<Shape>(initWhere).where('age', '>', 18).toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['status'], op: '=', value: 'active' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
	});

	it('multiple chaining from null init', () => {
		const result = newWhere<Shape>(null)
			.where('name', '=', 'Alice')
			.where('age', '>', 18)
			.toJSON();
		expect(result).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
	});

	it('tuple path where', () => {
		const result = newWhere<Shape>().where(['name'], '=', 'Bob').toJSON();
		expect(result).toEqual({ field: ['name'], op: '=', value: 'Bob' });
	});

	it('deeply nested', () => {
		const result = newWhere<Shape>()
			.where(({ or, and, where }) =>
				and([
					or([
						and([where('name', '=', 'a'), where('status', '=', 'x')]),
						and([where('name', '=', 'b'), where('status', '=', 'y')]),
					]),
					where('age', '>=', 18),
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
								{ field: ['name'], op: '=', value: 'a' },
								{ field: ['status'], op: '=', value: 'x' },
							],
						},
						{
							op: 'and',
							conditions: [
								{ field: ['name'], op: '=', value: 'b' },
								{ field: ['status'], op: '=', value: 'y' },
							],
						},
					],
				},
				{ field: ['age'], op: '>=', value: 18 },
			],
		});
	});
});
