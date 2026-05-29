import { toSql } from '../packages/agnostic-query/src/sql/pg.ts';

const schema = {
  table: 'users',
  where: { field: ['id'], op: '=', value: '1' },
  orderBy: [{ field: ['name'], direction: 'asc' }],
  limit: 10,
  offset: 2,
};

const out = toSql(schema as any);
console.log(JSON.stringify(out, null, 2));
