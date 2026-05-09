/**
 * - ["name"] → name
 * - ["address", "city"] → address: { city }
 * - ["tags", 0, "name"] → tags: [ { name } ]
 */
export type FieldPath = [string, ...(string | number)[]];

export type SchemaShape = Record<string, any>;

export type FieldPathByShape<TShape extends SchemaShape = SchemaShape> =
	TShape extends Record<string, any>
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

// 1. 定义一个工具类型，根据路径获取深度属性的类型
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
