import type { FieldPathByShape, SchemaShape } from './schema.ts';

export type QueryOrderBy<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> = {
	field: TField;
	direction: 'asc' | 'desc';
};
