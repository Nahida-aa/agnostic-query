import { expectType } from 'tsd';
import { aq, type QuerySchema } from '../src/core/index';

type DemoShape = {
	id: number;
	name: string;
	age: number;
	status: string;
	role: string;
	tags: { id: number; name: string }[];
	category: string[];
	address: {
		city: {
			name: string;
		};
	};
};

// toJSON should preserve the concrete query schema shape
expectType<QuerySchema<DemoShape>>(aq<DemoShape>().toJSON());

// Basic comparison where should infer the correct schema
expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>().where('name', '=', 'Alice').toJSON(),
);

expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>().where(['address', 'city', 'name'], '=', 'Paris').toJSON(),
);

// Logical chaining should keep the schema shape intact
expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>()
		.where('name', '=', 'Alice')
		.where('age', '>', 18)
		.toJSON(),
);

expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>()
		.where(({ and, where }) => and([where('age', '>=', 18), where('age', '<', 65)]))
		.toJSON(),
);

expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>()
		.where(({ or, where, not }) =>
			or([where('name', 'like', '%test%'), not(where('status', '=', 'archived'))]),
		)
		.toJSON(),
);

// orderBy should infer the same schema shape
expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>().orderBy('name').orderBy('age', 'desc').toJSON(),
);

// Mixed builder state should keep the same schema shape
expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>()
		.where('status', 'in', ['active', 'pending'])
		.orderBy('name')
		.limit(10)
		.offset(5)
		.toJSON(),
);

// Built-in where should keep the correct schema shape
expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>()
		.where(({ where }) => where(['tags', 0, 'name'], '=', 'tag1'))
		.toJSON(),
);

// set ops on array fields should work
expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>().where('tags', '@>', [{ id: 1, name: 'admin' }]).toJSON(),
);
expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>().where('category', '<@', ['admin', 'user']).toJSON(),
);
expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>().where('tags', '&&', [{ id: 2, name: 'mod' }]).toJSON(),
);

// 'is null' 2-arg form should work
expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>().where('name', 'is null').toJSON(),
);

// 'in' on deep scalar path should work (not an array field)
expectType<QuerySchema<DemoShape>>(
	aq<DemoShape>().where(['address', 'city', 'name'], 'in', ['Paris', 'London']).toJSON(),
);

// Invalid overloads / value combinations should be rejected
// @ts-expect-error - 'is null' operator should not accept a value
aq<DemoShape>().where('name', 'is null', 'x')
// @ts-expect-error - trap overload: 'in' on array field → error on op
aq<DemoShape>().where('tags', 'in', [[{ id: 1, name: 'tag1' }]])
// @ts-expect-error - trap overload: 'in' on array field (category)
aq<DemoShape>().where('category', 'in', ['a', 'b'])
// @ts-expect-error - set ops on scalar field → should error
aq<DemoShape>().where('name', '@>', ['admin'])
// @ts-expect-error - set ops on scalar deep path → should error
aq<DemoShape>().where(['address', 'city', 'name'], '@>', ['NYC'])
// @ts-expect-error - array value for 'in' on array element field should error
aq<DemoShape>().where(['tags', 0, 'id'], 'in', [[1]])
// @ts-expect-error - orderBy with invalid field name should error
aq<DemoShape>().orderBy('missing')

// No-op calls should still type-check and preserve builder chaining
expectType<QuerySchema<DemoShape>>(aq<DemoShape>().where(null).where().toJSON());