import * as v from 'valibot';
import type { SchemaShape } from './core/schema.js';
import {
	multiLogicalWhereOps,
	unaryComparisonOps,
} from './core/where.js';
import type { QueryWhere } from './core/where.js';

export const createWhereSchema = <TShape extends SchemaShape>() => {
	const fieldSchema = v.pipe(
		v.any(),
		v.transform((input) =>
			typeof input === 'string' ? [input] : input,
		),
		v.array(v.union([v.string(), v.number()])),
	);

	const unaryComparisonSchema = v.object({
		field: fieldSchema,
		op: v.picklist(unaryComparisonOps),
		value: v.any(),
	});

	const multiComparisonSchema = v.object({
		field: fieldSchema,
		op: v.literal('in'),
		values: v.array(v.any()),
	});

	type Out = QueryWhere<TShape, any>;
	const schema: v.GenericSchema<Out> = v.lazy(() =>
		v.union([
			unaryComparisonSchema,
			multiComparisonSchema,
			v.object({
				op: v.picklist(multiLogicalWhereOps),
				conditions: v.array(schema),
			}),
			v.object({
				op: v.literal('not'),
				condition: schema,
			}),
		]),
	);
	return schema;
};

export type CreateWhereSchemaOut<TShape extends SchemaShape> = v.InferOutput<
	ReturnType<typeof createWhereSchema<TShape>>
>;
