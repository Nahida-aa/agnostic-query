import z from 'zod';
import type { FieldPathByShape, SchemaShape } from '../core/schema.ts';
import {
	findWhere,
	multiComparisonOp,
	multiLogicalWhereOps,
	type QueryWhere,
	unaryComparisonOps,
} from '../core/where.ts';
import { fieldPathSchema } from './shard.ts';

export const createWhereSchema = <TShape extends SchemaShape>() => {
	// 1. 定义基础比较单元 (不再受 columns 限制)
	const unaryComparisonSchema = z.object({
		field: fieldPathSchema,
		op: z.enum(unaryComparisonOps),
		value: z.any(),
	});

	const multiComparisonSchema = z.object({
		field: fieldPathSchema,
		op: z.literal(multiComparisonOp),
		values: z.array(z.any()),
	});

	type Out = QueryWhere<TShape, any>; // 最终输出类型
	const schema: z.ZodType<Out, Out> = z.lazy(() =>
		z.union([
			unaryComparisonSchema,
			multiComparisonSchema,
			z.object({
				op: z.enum(multiLogicalWhereOps),
				conditions: z.array(schema),
			}),
			z.object({
				op: z.literal('not'),
				condition: schema,
			}),
		]),
	);

	return schema;
};

// demo
type UserShape = {
	id: string;
	name: string;
	address: {
		street: string;
		country: string;
		number: number;
	};
	tags: {
		name: string;
		order: number;
	}[];
};
const demoIn = {
	field: ['address', 'city'],
	op: 'in',
	conditions: ['New York', 'Los Angeles'],
};
const userWhereSchema = createWhereSchema<UserShape>();
const demoOut = userWhereSchema.parse(demoIn);

findWhere(demoOut).eq(['name'])?.value;
findWhere(demoOut).eq(['address', 'number'])?.value;
// findWhere(demoOut)({ field: ['address', 'number'], op: 'eq' })?.value;
// 1. 定义递归路径类型
type PathInto<T> = T extends (infer R)[]
	? [number, ...PathInto<R>] | [number]
	: T extends Record<string, any>
		? { [K in keyof T]: [K, ...PathInto<T[K]>] | [K] }[keyof T]
		: never;

const demo1 =
	<TShape extends Record<string, any>>(shape: TShape) =>
	<const TField extends PathInto<TShape>>(fieldPath: TField) => {
		return { shape, fieldPath };
	};
const user = {
	id: '123',
	name: 'John Doe',
	address: {
		street: '123 Main St',
		zip: '12345',
		country: 'US',
	},
	tags: [
		{
			name: 'tag1',
		},
	],
};
const result = demo1(user)(['address', 'street']);
const result1 = demo1(user)(['tags', 0, 'name']);
