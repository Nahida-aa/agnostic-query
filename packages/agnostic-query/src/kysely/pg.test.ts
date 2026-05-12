import { describe, expect, it } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import { Kysely, PGliteDialect } from 'kysely';
import { toKyselyWhere, toKyselyOrderBy } from './pg.ts';

interface DB { user: { id: string; name: string; age: number; tags: string[] } }

const dialect = new PGliteDialect({ pglite: new PGlite() });
const db = new Kysely<DB>({ dialect });

describe('toKyselyWhere', () => {
	it('=', () => {
		const expr = toKyselyWhere({ field: ['name'], op: '=', value: 'Alice' });
		expect(expr).toBeDefined();
	});

	it('>', () => {
		const expr = toKyselyWhere({ field: ['age'], op: '>', value: 18 });
		expect(expr).toBeDefined();
	});

	it('is null', () => {
		const expr = toKyselyWhere({ field: ['name'], op: 'is null' });
		expect(expr).toBeDefined();
	});

	it('@> (contains)', () => {
		const where: any = { field: ['tags'], op: '@>', value: ['admin'] };
		const expr = toKyselyWhere(where);
		expect(expr).toBeDefined();
	});

	it('<@ (contained by)', () => {
		const where: any = { field: ['tags'], op: '<@', value: ['admin'] };
		const expr = toKyselyWhere(where);
		expect(expr).toBeDefined();
	});

	it('&& (overlaps)', () => {
		const where: any = { field: ['tags'], op: '&&', value: ['admin'] };
		const expr = toKyselyWhere(where);
		expect(expr).toBeDefined();
	});

	it('in', () => {
		const expr = toKyselyWhere({ field: ['id'], op: 'in', values: ['1', '2'] });
		expect(expr).toBeDefined();
	});

	it('and', () => {
		const expr = toKyselyWhere({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
		expect(expr).toBeDefined();
	});

	it('or', () => {
		const expr = toKyselyWhere({
			op: 'or',
			conditions: [
				{ field: ['id'], op: '=', value: '1' },
				{ field: ['id'], op: '=', value: '2' },
			],
		});
		expect(expr).toBeDefined();
	});

	it('not', () => {
		const expr = toKyselyWhere({
			op: 'not',
			condition: { field: ['age'], op: '<', value: 18 },
		});
		expect(expr).toBeDefined();
	});

	it('nested and/or/not', () => {
		const expr = toKyselyWhere({
			op: 'and',
			conditions: [
				{
					op: 'or',
					conditions: [
						{ field: ['name'], op: 'like', value: '%test%' },
						{ op: 'not', condition: { field: ['age'], op: '=', value: 0 } },
					],
				},
				{ field: ['id'], op: 'in', values: ['a', 'b'] },
			],
		});
		expect(expr).toBeDefined();
	});

	it('null input returns empty callback', () => {
		const expr = toKyselyWhere(null);
		expect(typeof expr).toBe('function');
	});
});

describe('toKyselyOrderBy', () => {
	it('single clause', () => {
		const q = db.selectFrom('user').selectAll();
		const result = toKyselyOrderBy(q, [{ field: ['name'], direction: 'asc' }]);
		expect(result).not.toBe(q);
	});
});
