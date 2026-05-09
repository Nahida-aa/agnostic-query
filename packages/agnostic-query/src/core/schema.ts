/**
 * 从列名到目标字段的完整顺序路径。
 *
 * 首段为列名，后续每段对应一层键或索引，不可重排或省略。
 * 适配器根据路径中段的类型决定 SQL 文法：
 * - 列名后全是数字 → PG 数组下标（1-indexed）
 * - 列名后有字符串 → JSONB 操作符（`->` / `->>`）
 *
 * @example
 * `["name"]`             → 列 `name`
 * `["address", "city"]`  → 列 `address` → 键 `city`
 * `["tags", 0, "name"]`  → 列 `tags` → 数组索引 0 → 键 `name`
 */
export type FieldPath = [string, ...(string | number)[]];

export type SchemaShape = Record<string, any>;

/** （包含中间节点和叶子节点）
 * 但 目前在 在适配器层面 没有支持任意节点， 只支持 根节点和叶子节点
 */
export type FieldPathByShape<TShape extends SchemaShape = SchemaShape> =
	TShape extends SchemaShape
		? {
				[K in keyof TShape]: TShape[K] extends any[]
					?
							| [K]
							| [
									K,
									number,
									...FieldPathByShape<
										TShape[K][number] extends SchemaShape
											? TShape[K][number]
											: never
									>,
							  ]
							| [K, number]
					: TShape[K] extends SchemaShape
						? [K] | [K, ...FieldPathByShape<TShape[K]>]
						: [K];
			}[keyof TShape]
		: never;

// demo
// type DemoShape = {
// 	id: number;
// 	name: string;
// 	tags: { id: number; name: string }[];
// 	category: string[];
// 	address: {
// 		city: {
// 			name: string;
// 		};
// 	};
// };
// type DemoField = FieldPathByShape<DemoShape>;
// type DemoField2 = FieldPathByShape<Record<string, any>>;

/** 根据完整路径提取对应位置的类型 */
export type GetPathType<T, P extends readonly any[]> = P extends readonly [
	infer First,
	...infer Rest,
]
	? First extends keyof T
		? Rest extends []
			? T[First]
			: GetPathType<T[First], Rest>
		: First extends number // 处理数组索引
			? T extends (infer R)[]
				? Rest extends []
					? R
					: GetPathType<R, Rest>
				: never
			: never
	: T;
