import { describe, expect, it } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import { Kysely, PGliteDialect } from 'kysely';
import { toKyselyOrderBy, toKyselyWhere } from './pg.ts';

interface DB {
	user: { id: string; name: string; age: number; tags: string[] };
}

const dialect = new PGliteDialect({ pglite: new PGlite() });
const db = new Kysely<DB>({ dialect });

const toSql = (whereExpr: ReturnType<typeof toKyselyWhere>) => {
	return db.selectFrom('user').selectAll().where(whereExpr).compile();
};

describe('toKyselyWhere', () => {
	it('=', () => {
		const expr = toKyselyWhere({ field: ['name'], op: '=', value: 'Alice' });
		const sql = toSql(expr);
		expect(sql.sql).toBe('select * from "user" where "name" = $1');
		expect(sql.parameters).toEqual(['Alice']);
	});

	it('>', () => {
		const expr = toKyselyWhere({ field: ['age'], op: '>', value: 18 });
		const sql = toSql(expr);
		expect(sql.sql).toBe('select * from "user" where "age" > $1');
		expect(sql.parameters).toEqual([18]);
	});

	it('is null', () => {
		const expr = toKyselyWhere({ field: ['name'], op: 'is null' });
		const sql = toSql(expr);
		expect(sql.sql).toBe('select * from "user" where "name" is null');
		expect(sql.parameters).toEqual([]);
	});

	it('@> (contains)', () => {
		const where: any = { field: ['tags'], op: '@>', value: ['admin'] };
		const expr = toKyselyWhere(where);
		const sql = toSql(expr);
		expect(sql.sql).toBe('select * from "user" where "tags" @> ($1)');
		expect(sql.parameters).toEqual(['admin']);
	});

	it('<@ (contained by)', () => {
		const where: any = { field: ['tags'], op: '<@', value: ['admin'] };
		const expr = toKyselyWhere(where);
		const sql = toSql(expr);
		expect(sql.sql).toBe('select * from "user" where "tags" <@ ($1)');
		expect(sql.parameters).toEqual(['admin']);
	});

	it('&& (overlaps)', () => {
		const where: any = { field: ['tags'], op: '&&', value: ['admin'] };
		const expr = toKyselyWhere(where);
		const sql = toSql(expr);
		expect(sql.sql).toBe('select * from "user" where "tags" && ($1)');
		expect(sql.parameters).toEqual(['admin']);
	});

	it('in', () => {
		const expr = toKyselyWhere({ field: ['id'], op: 'in', values: ['1', '2'] });
		const sql = toSql(expr);
		expect(sql.sql).toBe('select * from "user" where "id" in ($1, $2)');
		expect(sql.parameters).toEqual(['1', '2']);
	});

	it('and', () => {
		const expr = toKyselyWhere({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
		const sql = toSql(expr);
		expect(sql.sql).toBe(
			'select * from "user" where ("name" = $1 and "age" > $2)',
		);
		expect(sql.parameters).toEqual(['Alice', 18]);
	});

	it('or', () => {
		const expr = toKyselyWhere({
			op: 'or',
			conditions: [
				{ field: ['id'], op: '=', value: '1' },
				{ field: ['id'], op: '=', value: '2' },
			],
		});
		const sql = toSql(expr);
		expect(sql.sql).toBe('select * from "user" where ("id" = $1 or "id" = $2)');
		expect(sql.parameters).toEqual(['1', '2']);
	});

	it('not', () => {
		const expr = toKyselyWhere({
			op: 'not',
			condition: { field: ['age'], op: '<', value: 18 },
		});
		const sql = toSql(expr);
		expect(sql.sql).toBe('select * from "user" where not "age" < $1');
		expect(sql.parameters).toEqual([18]);
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
		const sql = toSql(expr);
		expect(sql.sql).toBe(
			'select * from "user" where (("name" like $1 or not "age" = $2) and "id" in ($3, $4))',
		);
		expect(sql.parameters).toEqual(['%test%', 0, 'a', 'b']);
	});

	it('null input returns empty callback', () => {
		const expr = toKyselyWhere(null);
		expect(typeof expr).toBe('function');
		const sql = toSql(expr);
		expect(sql.sql).toBe('select * from "user" where 1 = 1');
		expect(sql.parameters).toEqual([]);
	});
});

describe('toKyselyOrderBy', () => {
	it('single clause', () => {
		const q = db.selectFrom('user').selectAll();
		const result = toKyselyOrderBy(q, [{ field: ['name'], direction: 'asc' }]);
		const sql = result.compile();
		expect(sql.sql).toBe('select * from "user" order by "name" asc');
	});
});
