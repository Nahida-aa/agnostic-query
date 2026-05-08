/**
 * - ["name"] → table.user.name
 * - ["address", "city"] → table.address.city
 * - ["tags", 0, "name"] → table.tags[0].name
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

export type GetPathType<T, P extends readonly any[]> =
	P extends [infer F, ...infer R]
		? F extends keyof T
			? R extends []
				? T[F]
				: GetPathType<T[F], R>
			: F extends number
				? T extends (infer U)[]
					? GetPathType<U, R>
					: never
				: never
		: T;
