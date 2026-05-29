import { describe, expect, it } from 'bun:test';
import { buildWhere, quoteIdent, toSql } from './common.ts';

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
});

describe('common.toSql', () => {
	it('builds full SELECT with WHERE and LIMIT', () => {
		const json = {
			table: 't',
			where: { field: ['id'], op: '=', value: 'x' },
		} as any;
		const result = toSql(
			json,
			(f: any) => `"${f[0]}"`,
			(w: any) =>
				buildWhere(
					w,
					(f: any) => `"${f[0]}"`,
					(i) => `$${i}`,
				),
		);
		expect(result.sql).toMatch(/^SELECT \* FROM "/);
		expect(result.params).toEqual(['x']);
	});
});
