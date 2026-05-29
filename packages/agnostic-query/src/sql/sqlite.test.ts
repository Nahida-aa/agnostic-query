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
});

describe('sqlite.toSql', () => {
	it('builds SELECT with WHERE and OFFSET/LIMIT', () => {
		const json = {
			table: 't',
			where: { field: ['id'], op: '=', value: 'x' },
			limit: 1,
			offset: 2,
		} as any;
		const result = toSql(json as any);
		expect(result.sql).toContain('SELECT * FROM "t"');
		expect(result.sql).toContain('LIMIT 1');
		expect(result.params).toEqual(['x']);
	});
});
