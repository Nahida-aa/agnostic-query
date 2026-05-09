import z from 'zod';
import type { FieldPathByShape, SchemaShape } from './core/schema.ts';
import {
	multiComparisonOp,
	multiLogicalWhereOps,
	type QueryWhere,
	unaryComparisonOps,
} from './core/where.ts';

export const createFieldPathSchema = <TShape extends SchemaShape>() =>
	z.preprocess(
		(val) => (typeof val === 'string' ? [val] : val),
		z.tuple([z.string()]).rest(z.union([z.string(), z.number()])),
	) as unknown as z.ZodType<FieldPathByShape<TShape>>;

export const createWhereSchema = <TShape extends SchemaShape>() => {
	const unaryComparisonSchema = z.object({
		field: createFieldPathSchema<TShape>(),
		op: z.enum(unaryComparisonOps),
		value: z.any(),
	});

	const multiComparisonSchema = z.object({
		field: createFieldPathSchema<TShape>(),
		op: z.literal(multiComparisonOp),
		values: z.array(z.any()),
	});

	type Out = QueryWhere<TShape, any>;
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
export const createOrderBySchema = <TShape extends SchemaShape>() => {
	// 1. 定义单个排序对象的验证器
	const itemSchema = z.object({
		// 使用 any 避开复杂的路径推导，但在导出时通过类型断言保证安全
		field: createFieldPathSchema<TShape>(),
		direction: z.enum(['asc', 'desc']),
	});

	// 2. 返回数组验证器
	return z.array(itemSchema);
};

export const createQuerySchema = <TShape extends SchemaShape>() => {
	return z.object({
		// 这里的 createWhereSchema 内部已经锁定了 TShape
		where: createWhereSchema<TShape>().nullish(),
		// 这里的 createOrderBySchema 内部也锁定了 TShape
		orderBy: createOrderBySchema<TShape>().optional(),
		limit: z.number().optional(),
		offset: z.number().default(0),
		// cursor: z.object({ // 之后再实现 游标查询
		// 	// whereFrom // 定位下一页起始点 // 获取游标之后的行的条件表达式。对于多列 ORDER BY，用 OR + AND 组合成复合条件。示例在对 col1 ASC, col2 DESC 且游标值为 [v1, v2] 时生成：
		// 	// (col1 > v1) OR (col1 = v1 AND col2 < v2)
		// 	// 这样能正确处理多列排序的边界。
		// 	// whereCurrent // 定位到等于当前游标值的行（仅用第一排序列）。用于处理边界上的重复值。对普通值就是 eq(col1, v1)，对 Date 等连续类型则用 AND(gte(...), lt(...)) 范围匹配防止精度问题
		// 	lastKey: z.string().or(z.number()).optional(),
		// }),
	});
};
