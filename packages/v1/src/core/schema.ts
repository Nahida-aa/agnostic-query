import { z } from 'zod';
export type FieldPath = [string, ...(string | number)[]];

// export type FieldPathByShape<TShape extends SchemaShape = SchemaShape> = [
// 	keyof TShape,
// 	...(string | number)[],
// ];

export type SchemaShape = Record<string, any>;
/**
 * - ["name"] → table.name
 * - ["address", "city"] → table.address.city
 * - ["tags", 0, "name"] → table.tags[0].name
 */
export type FieldPathByShape<TShape extends SchemaShape = SchemaShape> =
	TShape extends Record<string, any>
		? {
				[K in keyof TShape]: TShape[K] extends any[] // 如果属性是数组
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
					: TShape[K] extends SchemaShape // 如果属性是对象
						? [K] | [K, ...FieldPathByShape<TShape[K]>]
						: [K];
			}[keyof TShape]
		: never;

export type FieldPathByKey<TKey extends string = string> = [
	TKey,
	...(string | number)[],
];
