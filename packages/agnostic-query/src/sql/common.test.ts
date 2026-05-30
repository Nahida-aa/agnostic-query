import { describe, expect, it } from 'bun:test';
import { _toSql, buildWhere, quoteIdent } from './common.ts';

describe('common.quoteIdent', () => {
	it('quotes simple identifier', () => {
		expect(quoteIdent('name')).toBe('"name"');
	});

	it('escapes quotes', () => {
		expect(quoteIdent('a"b')).toBe('"a""b"');
	});
});

describe('common.buildWhere', () => {
	it('formats single value with $n', () => {
		const res = buildWhere(
			{ field: ['name'], op: '=', value: 'Alice' } as any,
			(f: any) => `"${f[0]}"`,
			(i) => `$${i}`,
		);
		expect(res).toEqual({ sql: '"name" = $1', params: ['Alice'] });
	});

	it('formats IN with ? placeholders', () => {
		const res = buildWhere(
			{ field: ['id'], op: 'in', values: ['1', '2'] } as any,
			(f: any) => `"${f[0]}"`,
			() => '?',
		);
		expect(res).toEqual({ sql: '"id" IN (?, ?)', params: ['1', '2'] });
	});

	it('handles nested and/or with increasing indexes', () => {
		const where = {
			op: 'and',
			conditions: [
				{ field: ['a'], op: '=', value: 1 },
				{
					op: 'or',
					conditions: [
						{ field: ['b'], op: '=', value: 2 },
						{ field: ['c'], op: '=', value: 3 },
					],
				},
			],
		} as any;
		const res = buildWhere(
			where,
			(f: any) => `"${f[0]}"`,
			(i) => `$${i}`,
		);
		expect(res).toEqual({
			sql: '("a" = $1 AND ("b" = $2 OR "c" = $3))',
			params: [1, 2, 3],
		});
	});

	it('returns undefined for empty logical branches', () => {
		const res = buildWhere(
			{
				op: 'and',
				conditions: [],
			} as any,
			(f: any) => `"${f[0]}"`,
			(i) => `$${i}`,
		);
		expect(res).toBeUndefined();
	});
});

describe('common.toSql', () => {
	it('builds full SELECT with WHERE, ORDER BY, LIMIT, and OFFSET', () => {
		const json = {
			table: 't',
			where: { field: ['id'], op: '=', value: 'x' },
			orderBy: [{ field: ['name'], direction: 'asc' }],
			limit: 10,
			offset: 5,
		} as any;
		const result = _toSql(
			json,
			(f: any) => `"${f[0]}"`,
			(w: any) =>
				buildWhere(
					w,
					(f: any) => `"${f[0]}"`,
					(i) => `$${i}`,
				),
		);
		expect(result.sql).toBe(
			'SELECT * FROM "t" WHERE "id" = $1 ORDER BY "name" ASC LIMIT 10 OFFSET 5',
		);
		expect(result.params).toEqual(['x']);
	});

	it('throws when table name is missing', () => {
		expect(() =>
			_toSql(
				{} as any,
				(f: any) => `"${f[0]}"`,
				(w: any) =>
					buildWhere(
						w,
						(f: any) => `"${f[0]}"`,
						(i) => `$${i}`,
					),
			),
		).toThrow('Table name is required');
	});
});
