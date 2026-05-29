import { expectError, expectType } from 'tsd';
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

// Invalid overloads / value combinations should be rejected
// @ts-expect-error - 'is null' operator should not accept a value
expectError(aq<DemoShape>().where('name', 'is null', 'x'));
// @ts-expect-error - in is not allowed on array fields
expectError(aq<DemoShape>().where('tags', 'in', [[{
        id: 1,
        name: '1'
    }]]));
// @ts-expect-error - 不能将类型“[number]”分配给类型“number”
expectError(aq<DemoShape>().where(['tags', 0, 'id'], 'in', [[1]]));
// @ts-expect-error - 类型“"missing"”的参数不能赋给类型“"address" | "age" | "category" | "id" | "name" | "role" | "status" | "tags" | ["address"] | ["age"] | ["category"] | ["id"] | ["name"] | ["role"] | ["status"] | ["tags"] | ["address", "city"] | ... 4 more ... | [...]”的参数。
expectError(aq<DemoShape>().orderBy('missing'));

// No-op calls should still type-check and preserve builder chaining
expectType<QuerySchema<DemoShape>>(aq<DemoShape>().where(null).where().toJSON());