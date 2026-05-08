import z from 'zod';
import type { SchemaShape } from './core/schema.ts';
import {
	multiComparisonOp,
	multiWhereOps,
	type QueryWhere,
	unaryComparisonOps,
} from './core/where.ts';

export const createWhereSchema =
	<TShape extends SchemaShape>() =>
	<TEnabled extends Extract<keyof TShape, string>>(columns?: TEnabled[]) => {
		if (columns !== undefined && columns.length === 0) return z.null();
		const unaryComparisonSchema = z.object({
			field: columns ? z.enum(columns) : z.string<TEnabled>(),
			operator: z.enum(unaryComparisonOps),
			conditions: z.any(),
		});
		const multiComparisonSchema = z.object({
			field: columns ? z.enum(columns) : z.string<TEnabled>(),
			operator: z.literal(multiComparisonOp),
			conditions: z.any(),
		});
		type Out = QueryWhere<TShape, TEnabled>;
		const schema: z.ZodType<Out, Out> = z.lazy(() =>
			z.union([
				unaryComparisonSchema,
				multiComparisonSchema,
				z.object({
					operator: z.enum(multiWhereOps),
					conditions: z.array(schema),
				}),
				z.object({
					operator: z.literal('not'),
					conditions: schema,
				}),
			]),
		);
		return schema;
	};

export type CreateWhereSchemaOut<TShape extends SchemaShape> = z.output<
	ReturnType<ReturnType<typeof createWhereSchema<TShape>>>
>;
