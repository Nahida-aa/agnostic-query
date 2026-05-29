import { describe, expect, it } from 'bun:test';
import { IR } from '@tanstack/db';
import type { QueryOrderBy } from './core/order-by.ts';
import { fromTanDb, fromTanDbOrderBy, fromTanDbWhere } from './tanstack-db.ts';

type UserShape = { id: string; name: string; age: number; role: string };

const ref = (path: Array<string>) => new IR.PropRef(path);
const value = <T>(input: T) => new IR.Value(input);
const func = (name: string, args: Array<IR.BasicExpression>) =>
	new IR.Func(name, args);

describe('fromTanDbOrderBy', () => {
	it('null returns empty array', () => {
		expect(fromTanDbOrderBy(null)).toEqual([]);
	});

	it('parses order clauses', () => {
		expect(
			fromTanDbOrderBy([
				{
					expression: ref(['name']),
					compareOptions: { direction: 'asc', nulls: 'last' },
				},
				{
					expression: ref(['age']),
					compareOptions: { direction: 'desc', nulls: 'first' },
				},
			]),
		).toMatchObject([
			{ field: ['name'], direction: 'asc' },
			{ field: ['age'], direction: 'desc' },
		]);
	});
});

describe('fromTanDbWhere', () => {
	it('null returns null', () => {
		expect(fromTanDbWhere(null)).toBeNull();
	});

	it('maps comparison operators', () => {
		expect(fromTanDbWhere(func('eq', [ref(['name']), value('Alice')]))).toEqual(
			{
				field: ['name'],
				op: '=',
				value: 'Alice',
			},
		);
		expect(fromTanDbWhere(func('isNull', [ref(['role'])]))).toEqual({
			field: ['role'],
			op: 'is null',
		});
		expect(fromTanDbWhere(func('isUndefined', [ref(['role'])]))).toEqual({
			field: ['role'],
			op: 'is null',
		});
		expect(
			fromTanDbWhere(func('in', [ref(['id']), value(['1', '2'])])),
		).toEqual({
			field: ['id'],
			op: 'in',
			values: ['1', '2'],
		});
	});

	it('maps logical expressions', () => {
		expect(
			fromTanDbWhere(
				func('and', [
					func('eq', [ref(['name']), value('Alice')]),
					func('or', [
						func('gt', [ref(['age']), value(18)]),
						func('not', [func('ilike', [ref(['role']), value('%admin%')])]),
					]),
				]),
			),
		).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{
					op: 'or',
					conditions: [
						{ field: ['age'], op: '>', value: 18 },
						{
							op: 'not',
							condition: {
								field: ['role'],
								op: 'ilike',
								value: '%admin%',
							},
						},
					],
				},
			],
		});
	});
});

describe('fromTanDb', () => {
	it('combines where, cursor, limit, and orderBy', () => {
		expect(
			fromTanDb<UserShape>({
				where: func('eq', [ref(['name']), value('Alice')]),
				cursor: {
					whereFrom: func('gt', [ref(['age']), value(18)]),
					whereCurrent: func('eq', [ref(['age']), value(18)]),
				},
				orderBy: [
					{
						expression: ref(['name']),
						compareOptions: { direction: 'asc', nulls: 'last' },
					},
				],
				limit: 25,
			}),
		).toMatchObject({
			limit: 25,
			where: {
				op: 'and',
				conditions: [
					{ field: ['name'], op: '=', value: 'Alice' },
					{ field: ['age'], op: '>', value: 18 },
				],
			},
			orderBy: [{ field: ['name'], direction: 'asc' }],
		});
	});

	it('returns empty filters for missing options', () => {
		expect(fromTanDb<UserShape>()).toEqual({
			limit: undefined,
			where: null,
			orderBy: [],
		});
	});

	it('keeps QueryOrderBy typing usable', () => {
		const ob: QueryOrderBy<UserShape>[] = [
			{ field: ['name'], direction: 'asc' },
			{ field: ['age'], direction: 'desc' },
		];
		expect(Array.isArray(ob)).toBe(true);
	});
});
