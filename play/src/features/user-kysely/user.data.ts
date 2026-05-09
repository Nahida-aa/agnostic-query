// ~/features/users/-search.ts (browser)

import type { QuerySchema } from 'agnostic-query/core';
import { fromKysely } from 'agnostic-query/kysely/fromKysely';
import {
	DummyDriver,
	Kysely,
	SqliteAdapter,
	SqliteIntrospector,
	SqliteQueryCompiler,
} from 'kysely';
import type { UserShape } from '#/features/user-kysely/user.schema.ts';

interface DB {
	user: UserShape;
}
const db = new Kysely<DB>({
	dialect: {
		createAdapter() {
			return new SqliteAdapter();
		},
		createDriver() {
			return new DummyDriver();
		},
		createIntrospector(db: Kysely<unknown>) {
			return new SqliteIntrospector(db);
		},
		createQueryCompiler() {
			return new SqliteQueryCompiler();
		},
	},
});
// Use Kysely to build a type-safe query — IDE autocompletion for fields
const q = db
	.selectFrom('user')
	.selectAll()
	.where('age', '>=', 18)
	.where('status', 'in', ['active', 'pending'])
	.orderBy('name', 'asc')
	.limit(20);

// Extract into a portable JSON-serialisable schema
const schema = fromKysely(q);
// => {
//   limit: 20,
//   orderBy: [{ field: ['name'], direction: 'asc' }],
//   where: {
//     op: 'and',
//     conditions: [
//       { field: ['age'], op: 'gte', value: 18 },
//       { field: ['status'], op: 'in', values: ['active', 'pending'] },
//     ],
//   },
// }

// Call the server function — TanStack Start serialises automatically
const users = await getUsers({ data: schema });
