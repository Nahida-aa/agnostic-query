import * as v from 'valibot';
import {
	baseWhereOps,
	multiWhereOps,
	type QueryWhere,
	type SchemaShape,
} from '@agnostic-query/core';

/**
 * 创建一个 Valibot Schema，用于在运行时验证 QueryWhere 结构的合法性。
 *
 * 分两步调用：
 * 1. `createWhereSchema<TShape>()` — 传入表结构，用于约束 conditions 的类型
 * 2. `(columns?)` — 传入可查询的列名白名单，约束 field 取值；不传则允许任意字段名
 *
 * columns 取值影响：
 * - `columns = undefined` — 不作白名单限制，field 接受任意字符串
 * - `columns = []` — 返回 `v.null()`，禁止一切查询
 * - `columns = ['id', 'name']` — 只允许查询指定字段
 *
 * 通过 `v.lazy` 实现递归验证，支持 BaseWhere / MultiWhere / UnaryWhere 三种结构的嵌套。
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
		if (columns !== undefined && columns.length === 0) return v.null();

		// 定义基础过滤器的 schema
		const baseFilterSchema = v.object({
			field: columns ? v.picklist(columns) : v.custom<TEnabled>((input) => typeof input === 'string'),
			operator: v.picklist(baseWhereOps),
			conditions: v.any(),
		});
		type Out = QueryWhere<TShape, TEnabled>;
		// 使用 lazy 处理递归
		// 注意：Valibot 的 lazy 需要显式声明返回类型以支持复杂的递归推断
		const schema: v.GenericSchema<Out> = v.lazy(() =>
			v.union([
				baseFilterSchema,
				// MultiFilter: and/or
				v.object({
					operator: v.picklist(multiWhereOps),
					conditions: v.array(schema),
				}),
				// UnaryFilter: not
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
