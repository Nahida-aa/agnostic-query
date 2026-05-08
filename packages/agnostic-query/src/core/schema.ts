/**
 * - ["name"] → table.user.name
 * - ["address", "city"] → table.address.city
 * - ["tags", 0, "name"] → table.tags[0].name
 */
export type FieldPath = [string, ...(string | number)[]];

export type SchemaShape = Record<string, any>;

// demo
type UserShape = {
	id: string;
	name: string;
	address: {
		street: string;
		zip: string;
		country: string;
	};
	tags: {
		name: string;
	}[];
};
