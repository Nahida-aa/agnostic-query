import * as v from 'valibot';
import {
	baseWhereOps,
	multiWhereOps,
	type QueryWhere,
	type SchemaShape,
} from './where.js';

export const createWhereSchema =
	<TShape extends SchemaShape>() =>
	<TEnabled extends Extract<keyof TShape, string>>(columns?: TEnabled[]) => {
		if (columns !== undefined && columns.length === 0) return v.null();
		const baseFilterSchema = v.object({
			field: columns ? v.picklist(columns) : v.custom<TEnabled>((input) => typeof input === 'string'),
			operator: v.picklist(baseWhereOps),
			conditions: v.any(),
		});
		type Out = QueryWhere<TShape, TEnabled>;
		const schema: v.GenericSchema<Out> = v.lazy(() =>
			v.union([
				baseFilterSchema,
				v.object({
					operator: v.picklist(multiWhereOps),
					conditions: v.array(schema),
				}),
				v.object({
					operator: v.literal('not'),
					conditions: schema,
				}),
			]),
		);
		return schema;
	};

export type CreateWhereSchemaOut<TShape extends SchemaShape> = v.InferOutput<
	ReturnType<ReturnType<typeof createWhereSchema<TShape>>>
>;
