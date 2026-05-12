import { describe, expect, it } from 'bun:test';
import { PGlite } from '@electric-sql/pglite';
import { Kysely, PGliteDialect, sql } from 'kysely';
import { fromKysely } from './fromKysely.ts';
import { toKyselyOrderBy } from './pg.ts';

interface DB {
	user: {
		id: string;
		name: string;
		age: number;
		tags: { id: number; name: string }[];
		category: string[];
		address: {
			city: {
				name: string;
			};
		};
	};
}

const dialect = new PGliteDialect({ pglite: new PGlite() });
const db = new Kysely<DB>({ dialect });

describe('fromKysely: limit/offset/orderBy', () => {
	it('extracts limit', () => {
		const q = db.selectFrom('user').selectAll().limit(10);
		const schema = fromKysely(q);
		expect(schema.limit).toBe(10);
	});

	it('extracts offset', () => {
		const q = db.selectFrom('user').selectAll().offset(5);
		const schema = fromKysely(q);
		expect(schema.offset).toBe(5);
	});

	it('extracts limit and offset', () => {
		const q = db.selectFrom('user').selectAll().limit(20).offset(10);
		const schema = fromKysely(q);
		expect(schema.limit).toBe(20);
		expect(schema.offset).toBe(10);
	});

	it('extracts orderBy from ColumnNode (.orderBy string)', () => {
		const q = db.selectFrom('user').selectAll().orderBy('name', 'asc');
		const schema = fromKysely(q);
		expect(schema.orderBy).toHaveLength(1);
		expect(schema.orderBy![0]).toEqual({ field: ['name'], direction: 'asc' });
	});

	it('extracts multiple orderBy clauses', () => {
		const q = db
			.selectFrom('user')
			.selectAll()
			.orderBy('name', 'asc')
			.orderBy('age', 'desc');
		const schema = fromKysely(q);
		expect(schema.orderBy).toHaveLength(2);
		expect(schema.orderBy![0]).toEqual({ field: ['name'], direction: 'asc' });
		expect(schema.orderBy![1]).toEqual({ field: ['age'], direction: 'desc' });
	});

	it('handles RawNode orderBy from toKyselyOrderBy', () => {
		const q = db.selectFrom('user').selectAll();
		const qWithOrder = toKyselyOrderBy(q, [
			{ field: ['name'], direction: 'asc' },
		]);
		const schema = fromKysely(qWithOrder);
		expect(schema.orderBy).toHaveLength(1);
		expect(schema.orderBy![0]).toEqual({ field: ['name'], direction: 'asc' });
	});

	it('round-trips JSON nested path orderBy via toKyselyOrderBy/fromKysely', () => {
		const q = db.selectFrom('user').selectAll();
		const qWithOrder = toKyselyOrderBy(q, [
			{ field: ['address', 'city', 'name'], direction: 'desc' },
		]);
		const schema = fromKysely(qWithOrder);
		expect(schema.orderBy).toHaveLength(1);
		expect(schema.orderBy![0]).toEqual({
			field: ['address', 'city', 'name'],
			direction: 'desc',
		});
	});

	it('round-trips PG array subscript orderBy via toKyselyOrderBy/fromKysely', () => {
		const q = db.selectFrom('user').selectAll();
		const qWithOrder = toKyselyOrderBy(q, [
			{ field: ['category', 0], direction: 'asc' },
		]);
		const schema = fromKysely(qWithOrder);
		expect(schema.orderBy).toHaveLength(1);
		expect(schema.orderBy![0]).toEqual({
			field: ['category', 0],
			direction: 'asc',
		});
	});

	it('round-trips nested array + object path orderBy via toKyselyOrderBy/fromKysely', () => {
		const q = db.selectFrom('user').selectAll();
		const qWithOrder = toKyselyOrderBy(q, [
			{ field: ['tags', 0, 'name'], direction: 'desc' },
		]);
		const schema = fromKysely(qWithOrder);
		expect(schema.orderBy).toHaveLength(1);
		expect(schema.orderBy![0]).toEqual({
			field: ['tags', 0, 'name'],
			direction: 'desc',
		});
	});

	it('returns empty schema for bare query', () => {
		const q = db.selectFrom('user').selectAll();
		const schema = fromKysely(q);
		expect(schema.limit).toBeUndefined();
		expect(schema.offset).toBeUndefined();
		expect(schema.orderBy).toBeUndefined();
	});
});

describe('fromKysely: where', () => {
	it('extracts eq', () => {
		const q = db.selectFrom('user').selectAll().where('name', '=', 'Alice');
		const schema = fromKysely(q);
		expect(schema.where).toEqual({ field: ['name'], op: '=', value: 'Alice' });
	});

	it('extracts gt', () => {
		const q = db.selectFrom('user').selectAll().where('age', '>', 18);
		const schema = fromKysely(q);
		expect(schema.where).toEqual({ field: ['age'], op: '>', value: 18 });
	});

	it('extracts gte', () => {
		const q = db.selectFrom('user').selectAll().where('age', '>=', 18);
		const schema = fromKysely(q);
		expect(schema.where).toEqual({ field: ['age'], op: '>=', value: 18 });
	});

	it('extracts lt', () => {
		const q = db.selectFrom('user').selectAll().where('age', '<', 18);
		const schema = fromKysely(q);
		expect(schema.where).toEqual({ field: ['age'], op: '<', value: 18 });
	});

	it('extracts lte', () => {
		const q = db.selectFrom('user').selectAll().where('age', '<=', 18);
		const schema = fromKysely(q);
		expect(schema.where).toEqual({ field: ['age'], op: '<=', value: 18 });
	});

	it('extracts like', () => {
		const q = db.selectFrom('user').selectAll().where('name', 'like', '%test%');
		const schema = fromKysely(q);
		expect(schema.where).toEqual({
			field: ['name'],
			op: 'like',
			value: '%test%',
		});
	});

	it('extracts ilike', () => {
		const q = db
			.selectFrom('user')
			.selectAll()
			.where('name', 'ilike', '%Test%');
		const schema = fromKysely(q);
		expect(schema.where).toEqual({
			field: ['name'],
			op: 'ilike',
			value: '%Test%',
		});
	});

	it('extracts in', () => {
		const q = db.selectFrom('user').selectAll().where('id', 'in', ['1', '2']);
		const schema = fromKysely(q);
		expect(schema.where).toEqual({
			field: ['id'],
			op: 'in',
			values: ['1', '2'],
		});
	});

	it('extracts and (chained .where)', () => {
		const q = db
			.selectFrom('user')
			.selectAll()
			.where('name', '=', 'Alice')
			.where('age', '>', 18);
		const schema = fromKysely(q);
		expect(schema.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
	});

	it('extracts and with eb.and()', () => {
		const q = db
			.selectFrom('user')
			.selectAll()
			.where((eb) => eb.and([eb('name', '=', 'Alice'), eb('age', '>', 18)]));
		const schema = fromKysely(q);
		expect(schema.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
	});

	it('extracts or', () => {
		const q = db
			.selectFrom('user')
			.selectAll()
			.where((eb) => eb.or([eb('name', '=', 'Alice'), eb('age', '>', 18)]));
		const schema = fromKysely(q);
		expect(schema.where).toEqual({
			op: 'or',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
			],
		});
	});

	it('extracts not', () => {
		const q = db
			.selectFrom('user')
			.selectAll()
			.where((eb) => eb.not(eb('age', '<', 18)));
		const schema = fromKysely(q);
		expect(schema.where).toEqual({
			op: 'not',
			condition: { field: ['age'], op: '<', value: 18 },
		});
	});

	it('extracts nested and/or/not', () => {
		const q = db
			.selectFrom('user')
			.selectAll()
			.where((eb) =>
				eb.and([
					eb.or([eb('name', 'like', '%test%'), eb.not(eb('age', '=', 0))]),
					eb('id', 'in', ['a', 'b']),
				]),
			);
		const schema = fromKysely(q);
		expect(schema.where).toEqual({
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
	});

	it('extracts 3+ chained ands (flattened)', () => {
		const q = db
			.selectFrom('user')
			.selectAll()
			.where('name', '=', 'Alice')
			.where('age', '>', 18)
			.where('id', 'in', ['1']);
		const schema = fromKysely(q);
		expect(schema.where).toEqual({
			op: 'and',
			conditions: [
				{ field: ['name'], op: '=', value: 'Alice' },
				{ field: ['age'], op: '>', value: 18 },
				{ field: ['id'], op: 'in', values: ['1'] },
			],
		});
	});
});
