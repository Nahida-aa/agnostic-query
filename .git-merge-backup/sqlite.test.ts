import { describe, expect, it } from 'bun:test';
import { toDrizzleWhere } from './sqlite.ts';

describe('toDrizzleWhere (sqlite)', () => {
	it('handles eq', () => {
		const table = { name: 'name' };
		const result = toDrizzleWhere(table, {
			field: ['name'],
			op: '=',
			value: 'Alice',
		});
		expect(result).toBeDefined();
	});

	it('handles is null', () => {
		const table = { name: 'name' };
		const result = toDrizzleWhere(table, { field: ['name'], op: 'is null' });
		expect(result).toBeDefined();
	});
});
