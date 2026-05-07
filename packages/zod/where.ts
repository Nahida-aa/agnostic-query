import z from 'zod';
import {
	baseWhereOps,
	multiWhereOps,
	type QueryWhere,
	type SchemaShape,
} from '@agnostic-query/core';

/**
 * 创建一个 Zod Schema，用于在运行时验证 QueryWhere 结构的合法性。
 *
 * 分两步调用：
 * 1. `createWhereSchema<TShape>()` — 传入表结构，用于约束 conditions 的类型
 * 2. `(columns?)` — 传入可查询的列名白名单，约束 field 取值；不传则允许任意字段名
 *
 * columns 取值影响：
 * - `columns = undefined` — 不作白名单限制，field 接受任意字符串
 * - `columns = []` — 返回 `z.null()`，禁止一切查询
 * - `columns = ['id', 'name']` — 只允许查询指定字段
 *
 * 通过 `z.lazy` 实现递归验证，支持 BaseWhere / MultiWhere / UnaryWhere 三种结构的嵌套。
 *
 * @example
 * ```ts
 * type User = { id: string; name: string; age: number };
 *
 * // 限制可查询字段
 * const schema = createWhereSchema<User>()(['id', 'name', 'age']);
 * schema.parse({ field: 'name', operator: 'eq', conditions: 'Alice' });
 *
 * // 不限制字段（仅约束 conditions 类型）
 * const loose = createWhereSchema<User>()();
 * loose.parse({ field: 'any_field', operator: 'eq', conditions: 'ok' });
 * ```
 */
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

/** 从 CreateWhereSchema 的类型参数推导出 QueryWhere 的输出类型 */
export type CreateWhereSchemaOut<TShape extends SchemaShape> = z.output<
	ReturnType<ReturnType<typeof createWhereSchema<TShape>>>
>;
