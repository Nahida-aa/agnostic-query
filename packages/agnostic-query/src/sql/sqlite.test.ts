import { describe, expect, it } from 'bun:test';
import { toSql, toSqlWhere } from './sqlite.ts';

describe('sqlite.toSqlWhere', () => {
	it('uses ? placeholder for equals', () => {
		const res = toSqlWhere({ field: ['name'], op: '=', value: 'Alice' });
		expect(res).toEqual({ sql: '"name" = ?', params: ['Alice'] });
	});

	it('formats IN with ? placeholders', () => {
		const res = toSqlWhere({
			field: ['id'],
			op: 'in',
			values: ['1', '2', '3'],
		});
		expect(res).toEqual({ sql: '"id" IN (?, ?, ?)', params: ['1', '2', '3'] });
	});

	it('formats json_extract path for multi-segment', () => {
		const res = toSqlWhere({
			field: ['data', 'address', 'city'],
			op: '=',
			value: 'NYC',
		});
		expect(res).toEqual({
			sql: 'json_extract("data", \'$.address.city\') = ?',
			params: ['NYC'],
		});
	});

	it('returns undefined for null input', () => {
		expect(toSqlWhere(null)).toBeUndefined();
	});

	it('supports nested logical conditions', () => {
		const res = toSqlWhere({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{
					op: 'or',
					conditions: [
						{ field: ['age'], op: '>', value: 18 },
						{ op: 'not', condition: { field: ['id'], op: 'is null' } },
					],
				},
			],
		});
		expect(res).toEqual({
			sql: '("name" = ? AND ("age" > ? OR NOT ("id" IS NULL)))',
			params: ['Alice', 18],
		});
	});
});

describe('sqlite.toSql', () => {
	it('builds SELECT with WHERE, ORDER BY, OFFSET/LIMIT', () => {
		const json = {
			table: 't',
			where: { field: ['id'], op: '=', value: 'x' },
			orderBy: [{ field: ['name'], direction: 'desc' }],
			limit: 1,
			offset: 2,
		} as any;
		const result = toSql(json as any);
		expect(result.sql).toContain('SELECT * FROM "t"');
		expect(result.sql).toContain('ORDER BY "name" DESC');
		expect(result.sql).toContain('LIMIT 1');
		expect(result.sql).toContain('OFFSET 2');
		expect(result.params).toEqual(['x']);
	});

	it('throws when table is missing', () => {
		expect(() => toSql({} as any)).toThrow('Table name is required');
	});
});
