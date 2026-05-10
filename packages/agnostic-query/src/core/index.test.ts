import { describe, expect, it } from 'bun:test';
import { aq, type QuerySchema } from './index.ts';

type DemoShape = {
	id: number;
	name: string;
	age: number;
	status: string;
	role: string;
};

describe('aq builder', () => {
	it('toJSON returns empty schema initially', () => {
		const result = aq<DemoShape>().toJSON();
		expect(result.where).toBeUndefined();
		expect(result).toEqual({});
	});

	it('string shorthand where', () => {
		const result = aq<DemoShape>().where('name', 'eq', 'Alice').toJSON();
		expect(result.where).toEqual({
			field: ['name'],
			op: 'eq',
			value: 'Alice',
		});
	});

	it('tuple path where', () => {
		const result = aq<DemoShape>().where(['name'], 'eq', 'Bob').toJSON();
		expect(result.where).toEqual({
			field: ['name'],
			op: 'eq',
			value: 'Bob',
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
			.where('name', 'eq', 'Alice')
			.where('age', 'gt', 18)
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['age'], op: 'gt', value: 18 },
			],
		});
	});

	it('three chained wheres flatten into single AND', () => {
		const result = aq<DemoShape>()
			.where('name', 'eq', 'Alice')
			.where('age', 'gt', 18)
			.where('status', 'eq', 'active')
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['age'], op: 'gt', value: 18 },
				{ field: ['status'], op: 'eq', value: 'active' },
			],
		});
	});

	it('callbacks: or', () => {
		const result = aq<DemoShape>()
			.where(({ or, where }) =>
				or([where('name', 'eq', '3'), where('name', 'eq', '4')]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'or',
			conditions: [
				{ field: ['name'], op: 'eq', value: '3' },
				{ field: ['name'], op: 'eq', value: '4' },
			],
		});
	});

	it('callbacks: and', () => {
		const result = aq<DemoShape>()
			.where(({ and, where }) =>
				and([where('age', 'gte', 18), where('age', 'lt', 65)]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['age'], op: 'gte', value: 18 },
				{ field: ['age'], op: 'lt', value: 65 },
			],
		});
	});

	it('callbacks: not', () => {
		const result = aq<DemoShape>()
			.where(({ not, where }) => not(where('role', 'eq', 'banned')))
			.toJSON();
		expect(result.where).toEqual({
			op: 'not',
			condition: { field: ['role'], op: 'eq', value: 'banned' },
		});
	});

	it('mix simple and callback', () => {
		const result = aq<DemoShape>()
			.where('status', 'eq', 'active')
			.where(({ or, where }) =>
				or([where('name', 'eq', 'admin'), where('name', 'eq', 'mod')]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['status'], op: 'eq', value: 'active' },
				{
					op: 'or',
					conditions: [
						{ field: ['name'], op: 'eq', value: 'admin' },
						{ field: ['name'], op: 'eq', value: 'mod' },
					],
				},
			],
		});
	});

	it('callback first then simple where', () => {
		const result = aq<DemoShape>()
			.where(({ or, where }) =>
				or([where('name', 'eq', 'x'), where('name', 'eq', 'y')]),
			)
			.where('age', 'gte', 10)
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{
					op: 'or',
					conditions: [
						{ field: ['name'], op: 'eq', value: 'x' },
						{ field: ['name'], op: 'eq', value: 'y' },
					],
				},
				{ field: ['age'], op: 'gte', value: 10 },
			],
		});
	});

	it('nested callbacks: and within or', () => {
		const result = aq<DemoShape>()
			.where(({ or, and, where }) =>
				or([
					where('role', 'eq', 'admin'),
					// and returns QueryWhere directly, can't nest in or which takes WhereExpr[]
					// this tests flat or only
				]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'or',
			conditions: [{ field: ['role'], op: 'eq', value: 'admin' }],
		});
	});

	it('in operator in callback', () => {
		const result = aq<DemoShape>()
			.where(({ or, where }) =>
				or([where('status', 'in', ['a', 'b']), where('status', 'eq', 'c')]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'or',
			conditions: [
				{ field: ['status'], op: 'in', values: ['a', 'b'] },
				{ field: ['status'], op: 'eq', value: 'c' },
			],
		});
	});

	it('toJSON returns the full schema', () => {
		const schema: QuerySchema<DemoShape> = {
			limit: 10,
			offset: 0,
			orderBy: [{ field: ['name'], direction: 'asc' }],
		};

		const result = aq<DemoShape>(schema).where('name', 'eq', 'test').toJSON();
		expect(result.limit).toBe(10);
		expect(result.offset).toBe(0);
		expect(result.orderBy).toEqual([{ field: ['name'], direction: 'asc' }]);
		expect(result.where).toEqual({ field: ['name'], op: 'eq', value: 'test' });
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
			.where('name', 'eq', 'Alice')
			.orderBy('age', 'desc')
			.toJSON();
		expect(result.where).toEqual({ field: ['name'], op: 'eq', value: 'Alice' });
		expect(result.orderBy).toEqual([{ field: ['age'], direction: 'desc' }]);
	});

	it('where accepts a QueryWhere object directly', () => {
		const where: QuerySchema<DemoShape>['where'] = {
			field: ['name'],
			op: 'eq',
			value: 'Alice',
		};
		const result = aq<DemoShape>().where(where).toJSON();
		expect(result.where).toEqual({ field: ['name'], op: 'eq', value: 'Alice' });
	});

	it('where with QueryWhere object appends via AND', () => {
		const existing: QuerySchema<DemoShape>['where'] = {
			field: ['name'],
			op: 'eq',
			value: 'Alice',
		};
		const extra: QuerySchema<DemoShape>['where'] = {
			field: ['age'],
			op: 'gt',
			value: 18,
		};
		const result = aq<DemoShape>().where(existing).where(extra).toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['age'], op: 'gt', value: 18 },
			],
		});
	});

	it('where with QueryWhere in callback', () => {
		const roleWhere: QuerySchema<DemoShape>['where'] = {
			field: ['role'],
			op: 'eq',
			value: 'admin',
		};
		const result = aq<DemoShape>()
			.where(({ or, where }) =>
				or([where('name', 'eq', 'Alice'), where(roleWhere)]),
			)
			.toJSON();
		expect(result.where).toEqual({
			op: 'or',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['role'], op: 'eq', value: 'admin' },
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
			op: 'eq',
			value: 'Alice',
		};
		const result = aq<DemoShape>()
			.where(nameWhere)
			.where('age', 'gt', 18)
			.toJSON();
		expect(result.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: 'eq', value: 'Alice' },
				{ field: ['age'], op: 'gt', value: 18 },
			],
		});
	});
});
