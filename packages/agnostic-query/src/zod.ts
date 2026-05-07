import z from 'zod';
import {
	baseWhereOps,
	multiWhereOps,
	type QueryWhere,
	type SchemaShape,
} from './where.js';

export const createWhereSchema =
	<TShape extends SchemaShape>() =>
	<TEnabled extends Extract<keyof TShape, string>>(columns?: TEnabled[]) => {
		if (columns !== undefined && columns.length === 0) return z.null();
		const baseFilterSchema = z.object({
			field: columns ? z.enum(columns) : z.string<TEnabled>(),
			operator: z.enum(baseWhereOps),
			conditions: z.any(),
		});
		type Out = QueryWhere<TShape, TEnabled>;
		const schema: z.ZodType<Out, Out> = z.lazy(() =>
			z.union([
				baseFilterSchema,
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
