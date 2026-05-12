import { describe, expect, it } from 'bun:test';
import { aq, type QuerySchema } from './index.ts';
import type { QueryWhere } from './where.ts';
import { findWhere } from './where.ts';

type DemoShape = {
	id: number;
	name: string;
	age: number;
	status: string;
	role: string;
	tags: { id: number; name: string }[];
	category: string[];
	address: {
		city: {
			name: string;
		};
	};
};

describe('aq builder', () => {
	it('toJSON returns empty schema initially', () => {
		const result = aq<DemoShape>().toJSON();
		expect(result.where).toBeUndefined();
		expect(result).toEqual({});
	});

	it('string shorthand where', () => {
		const result = aq<DemoShape>().where('name', '=', 'Alice').toJSON();
		expect(result.where).toEqual({
			field: ['name'],
			op: '=',
			value: 'Alice',
		});
	});

	it('tuple path where', () => {
		const result = aq<DemoShape>().where(['name'], '=', 'Bob').toJSON();
		expect(result.where).toEqual({
			field: ['name'],
			op: '=',
			value: 'Bob',
		});
	});

	it('where with is null operator', () => {
		const result = aq<DemoShape>().where('name', 'is null').toJSON();
		expect(result.where).toEqual({
			field: ['name'],
			op: 'is null',
		});
	});

	it('where with in operator', () => {
		const result = aq<DemoShape>().where('status', 'in', ['a', 'b']).toJSON();
		expect(result.where).toEqual({
			field: ['status'],
			op: 'in',
			values: ['a', 'b'],
		});
	});

	it('chaining wheres creates AND', () => {
		const result = aq<DemoShape>()
			.where('name', '=', 'Alice')
			.where('age', '>', 18)
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
	});

	it('three chained wheres flatten into single AND', () => {
		const result = aq<DemoShape>()
			.where('name', '=', 'Alice')
			.where('age', '>', 18)
			.where('status', '=', 'active')
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
				{ field: ['status'], op: '=', value: 'active' },
			],
		});
	});

	it('callbacks: or', () => {
		const result = aq<DemoShape>()
			.where(({ or, where }) =>
				or([where('name', '=', '3'), where('name', '=', '4')]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'or',
			conditions: [
				{ field: ['name'], op: '=', value: '3' },
				{ field: ['name'], op: '=', value: '4' },
			],
		});
	});

	it('callbacks: and', () => {
		const result = aq<DemoShape>()
			.where(({ and, where }) =>
				and([where('age', '>=', 18), where('age', '<', 65)]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['age'], op: '>=', value: 18 },
				{ field: ['age'], op: '<', value: 65 },
			],
		});
	});

	it('callbacks: not', () => {
		const result = aq<DemoShape>()
			.where(({ not, where }) => not(where('role', '=', 'banned')))
			.toJSON();
		expect(result.where).toEqual({
			op: 'not',
			condition: { field: ['role'], op: '=', value: 'banned' },
		});
	});

	it('mix simple and callback', () => {
		const result = aq<DemoShape>()
			.where('status', '=', 'active')
			.where(({ or, where }) =>
				or([where('name', '=', 'admin'), where('name', '=', 'mod')]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['status'], op: '=', value: 'active' },
				{
					op: 'or',
					conditions: [
						{ field: ['name'], op: '=', value: 'admin' },
						{ field: ['name'], op: '=', value: 'mod' },
					],
				},
			],
		});
	});

	it('callback first then simple where', () => {
		const result = aq<DemoShape>()
			.where(({ or, where }) =>
				or([where('name', '=', 'x'), where('name', '=', 'y')]),
			)
			.where('age', '>=', 10)
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{
					op: 'or',
					conditions: [
						{ field: ['name'], op: '=', value: 'x' },
						{ field: ['name'], op: '=', value: 'y' },
					],
				},
				{ field: ['age'], op: '>=', value: 10 },
			],
		});
	});

	it('nested callbacks: and within or', () => {
		const result = aq<DemoShape>()
			.where(({ or, and, where }) =>
				or([
					and([where('role', '=', 'admin'), where('status', '=', 'active')]),
					where('age', '>', 30),
				]),
			)
			.toJSON();
		expect(result.where).toEqual({
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

	it('deeply nested: and > or > and', () => {
		const result = aq<DemoShape>()
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
		expect(result.where).toEqual({
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

	it('nested not within and within or', () => {
		const result = aq<DemoShape>()
			.where(({ or, and, not, where }) =>
				or([
					and([not(where('status', '=', 'banned')), where('age', '>=', 18)]),
					where('role', '=', 'admin'),
				]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'or',
			conditions: [
				{
					op: 'and',
					conditions: [
						{ op: 'not', condition: { field: ['status'], op: '=', value: 'banned' } },
						{ field: ['age'], op: '>=', value: 18 },
					],
				},
				{ field: ['role'], op: '=', value: 'admin' },
			],
		});
	});

	it('double not: not(not(...))', () => {
		const result = aq<DemoShape>()
			.where(({ not, where }) =>
				not(not(where('status', '=', 'active'))),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'not',
			condition: {
				op: 'not',
				condition: { field: ['status'], op: '=', value: 'active' },
			},
		});
	});

	it('in operator in callback', () => {
		const result = aq<DemoShape>()
			.where(({ or, where }) =>
				or([where('status', 'in', ['a', 'b']), where('status', '=', 'c')]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'or',
			conditions: [
				{ field: ['status'], op: 'in', values: ['a', 'b'] },
				{ field: ['status'], op: '=', value: 'c' },
			],
		});
	});

	it('toJSON returns the full schema', () => {
		const schema: QuerySchema<DemoShape> = {
			limit: 10,
			offset: 0,
			orderBy: [{ field: ['name'], direction: 'asc' }],
		};

		const result = aq<DemoShape>(schema).where('name', '=', 'test').toJSON();
		expect(result.limit).toBe(10);
		expect(result.offset).toBe(0);
		expect(result.orderBy).toEqual([{ field: ['name'], direction: 'asc' }]);
		expect(result.where).toEqual({ field: ['name'], op: '=', value: 'test' });
	});

	it('orderBy is undefined when not set', () => {
		const result = aq<DemoShape>().toJSON();
		expect(result.orderBy).toBeUndefined();
	});

	it('orderBy defaults to asc', () => {
		const result = aq<DemoShape>().orderBy('name').toJSON();
		expect(result.orderBy).toEqual([{ field: ['name'], direction: 'asc' }]);
	});

	it('orderBy with desc direction', () => {
		const result = aq<DemoShape>().orderBy('name', 'desc').toJSON();
		expect(result.orderBy).toEqual([{ field: ['name'], direction: 'desc' }]);
	});

	it('chaining orderBy appends entries', () => {
		const result = aq<DemoShape>()
			.orderBy('name', 'asc')
			.orderBy('age', 'desc')
			.toJSON();
		expect(result.orderBy).toEqual([
			{ field: ['name'], direction: 'asc' },
			{ field: ['age'], direction: 'desc' },
		]);
	});

	it('orderBy with initial schema appends', () => {
		const schema: QuerySchema<DemoShape> = {
			orderBy: [{ field: ['name'], direction: 'asc' }],
		};
		const result = aq<DemoShape>(schema).orderBy('age', 'desc').toJSON();
		expect(result.orderBy).toEqual([
			{ field: ['name'], direction: 'asc' },
			{ field: ['age'], direction: 'desc' },
		]);
	});

	it('where and orderBy can be chained together', () => {
		const result = aq<DemoShape>()
			.where('name', '=', 'Alice')
			.orderBy('age', 'desc')
			.toJSON();
		expect(result.where).toEqual({ field: ['name'], op: '=', value: 'Alice' });
		expect(result.orderBy).toEqual([{ field: ['age'], direction: 'desc' }]);
	});

	it('where accepts a QueryWhere object directly', () => {
		const where: QuerySchema<DemoShape>['where'] = {
			field: ['name'],
			op: '=',
			value: 'Alice',
		};
		const result = aq<DemoShape>().where(where).toJSON();
		expect(result.where).toEqual({ field: ['name'], op: '=', value: 'Alice' });
	});

	it('where with QueryWhere object appends via AND', () => {
		const existing: QuerySchema<DemoShape>['where'] = {
			field: ['name'],
			op: '=',
			value: 'Alice',
		};
		const extra: QuerySchema<DemoShape>['where'] = {
			field: ['age'],
			op: '>',
			value: 18,
		};
		const result = aq<DemoShape>().where(existing).where(extra).toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
	});

	it('where with QueryWhere in callback', () => {
		const roleWhere: QuerySchema<DemoShape>['where'] = {
			field: ['role'],
			op: '=',
			value: 'admin',
		};
		const result = aq<DemoShape>()
			.where(({ or, where }) =>
				or([where('name', '=', 'Alice'), where(roleWhere)]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'or',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['role'], op: '=', value: 'admin' },
			],
		});
	});

	it('where with QueryWhere using in operator', () => {
		const statusWhere: QuerySchema<DemoShape>['where'] = {
			field: ['status'],
			op: 'in',
			values: ['active', 'pending'],
		};
		const result = aq<DemoShape>().where(statusWhere).toJSON();
		expect(result.where).toEqual({
			field: ['status'],
			op: 'in',
			values: ['active', 'pending'],
		});
	});

	it('where mix QueryWhere object and simple where', () => {
		const nameWhere: QuerySchema<DemoShape>['where'] = {
			field: ['name'],
			op: '=',
			value: 'Alice',
		};
		const result = aq<DemoShape>()
			.where(nameWhere)
			.where('age', '>', 18)
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
	});

	it('where(null) is a no-op', () => {
		const result = aq<DemoShape>()
			.where(null)
			.where('name', '=', 'Alice')
			.toJSON();
		expect(result.where).toEqual({ field: ['name'], op: '=', value: 'Alice' });
	});

	it('where(undefined) is a no-op', () => {
		const result = aq<DemoShape>()
			.where(undefined)
			.where('name', '=', 'Alice')
			.toJSON();
		expect(result.where).toEqual({ field: ['name'], op: '=', value: 'Alice' });
	});

	it('where() with no args is a no-op', () => {
		const result = aq<DemoShape>()
			.where()
			.where('name', '=', 'Alice')
			.toJSON();
		expect(result.where).toEqual({ field: ['name'], op: '=', value: 'Alice' });
	});

	it('null/undefined where does not break chaining', () => {
		const result = aq<DemoShape>()
			.where('status', '=', 'active')
			.where(null)
			.where('age', '>', 18)
			.where(undefined)
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['status'], op: '=', value: 'active' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
	});

	it('not with null condition produces undefined where', () => {
		const result = aq<DemoShape>()
			.where(({ not, where }) =>
				not(where(null!)),
			)
			.toJSON();
		expect(result.where).toBeUndefined();
	});
});

// === Compile-time overload resolution tests ===
// These are never executed — only typechecked by tsgo --noEmit

function expectType<T>(_v: T): void {}

function _typeTests() {
	// 2-arg 'is null' compiles
	aq<DemoShape>().where('name', 'is null');

	// 3-arg 'is null' should error (PredicateOp → never in ComparisonWhereValue)
	// @ts-expect-error
	aq<DemoShape>().where('name', 'is null', 'x');

	// 'in' on array field should error
	// @ts-expect-error
	aq<DemoShape>().where('tags', 'in', [[1]]);

	// 'in' on array field via tuple path should error
	// @ts-expect-error
	aq<DemoShape>().where(['tags'], 'in', [[1]]);

	// findWhere find('address', '=')?.value → { city: { name: string } } | undefined
	const where2 = {} as QueryWhere<DemoShape>;
	expectType<{ city: { name: string } } | undefined>(
		findWhere(where2).find('address', '=')?.value,
	);
	// findWhere find('tags', '@>')?.value → { id: number; name: string }[] | undefined
	expectType<{ id: number; name: string }[] | undefined>(
		findWhere(where2).find('tags', '@>')?.value,
	);
	// findWhere find('id', 'in')?.values → number[] | undefined
	expectType<number[] | undefined>(
		findWhere(where2).find('id', 'in')?.values,
	);
	// findWhere find('name', 'like') returns UnaryComparisonWhere (has .value)
	expectType<string | undefined>(
		findWhere(where2).find('name', 'like')?.value,
	);
}
