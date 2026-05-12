import type { FieldPathByShape, SchemaShape } from './schema';

export const orderByDirections = ['asc', 'desc'] as const;
export type OrderByDirection = (typeof orderByDirections)[number];

export type QueryOrderBy<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> = {
	field: TField;
	direction: OrderByDirection;
};
