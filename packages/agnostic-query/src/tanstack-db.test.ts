import { describe, expect, it } from 'bun:test';
import { fromTanDbOrderBy } from './tanstack-db.ts';
import type { QueryOrderBy } from './core/order-by.ts';

type UserShape = { id: string; name: string; age: number; role: string };

describe('fromTanDbOrderBy', () => {
	it('null returns empty array', () => {
		expect(fromTanDbOrderBy(null)).toEqual([]);
	});
});

describe('QueryOrderBy type', () => {
	it('accepts valid order by array', () => {
		const ob: QueryOrderBy<UserShape>[] = [
			{ field: ['name'], direction: 'asc' },
			{ field: ['age'], direction: 'desc' },
		];
		expect(Array.isArray(ob)).toBe(true);
	});
});
